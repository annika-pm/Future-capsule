/**
 * GET /api/capsules/[id] - Fetch single capsule with unlock validation
 * PUT /api/capsules/[id] - Update capsule (only before unlock)
 * DELETE /api/capsules/[id] - Delete capsule
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '@/middleware/auth-middleware';
import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ServerError,
  formatErrorResponse,
  logger,
} from '@/lib/errors';
import {
  validateCapsuleData,
  isValidUnlockDate,
} from '@/lib/capsule-unlock';

// Initialize Supabase Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * GET /api/capsules/[id] - Fetch single capsule
 * With unlock validation - returns full content if unlocked, preview if locked
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate request
    const authRequest = await withAuth(request);
    const userId = authRequest.user?.id;

    if (!userId) {
      throw new AuthenticationError('User ID not found in token');
    }

    const resolvedParams = await params;
    const capsuleId = resolvedParams.id;

    // Validate capsule ID format
    if (!capsuleId || capsuleId.trim().length === 0) {
      throw new ValidationError('Capsule ID is required');
    }

    // Fetch capsule from database
    const { data: capsule, error } = await supabase
      .from('capsules')
      .select('*')
      .eq('id', capsuleId)
      .eq('user_id', userId)
      .single();

    if (error || !capsule) {
      logger.unauthorizedAccess(userId, `capsule:${capsuleId}`, 'Not found or unauthorized');
      throw new NotFoundError('Capsule not found');
    }

    // Check unlock status
    const now = new Date();
    const unlockDate = new Date(capsule.unlock_date);
    const isLocked = now < unlockDate;

    const response: any = {
      id: capsule.id,
      user_id: capsule.user_id,
      title: capsule.title,
      message: capsule.message,
      mood: capsule.mood,
      unlock_date: capsule.unlock_date,
      photo_url: capsule.photo_url,
      created_at: capsule.created_at,
      updated_at: capsule.updated_at,
      isLocked,
    };

    logger.success('get_capsule', userId, { capsuleId });

    return NextResponse.json(
      {
        success: true,
        data: response,
        message: 'Capsule retrieved successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}

/**
 * PUT /api/capsules/[id] - Update capsule
 *
 * Restrictions:
 * - Only unlocked (before unlock date) capsules can be edited
 * - Cannot change: unlock_date, created_at, user_id
 * - Can change: title, message, mood, photo_url
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate request
    const authRequest = await withAuth(request);
    const userId = authRequest.user?.id;

    if (!userId) {
      throw new AuthenticationError('User ID not found in token');
    }

    const resolvedParams = await params;
    const capsuleId = resolvedParams.id;

    // Validate capsule ID
    if (!capsuleId || capsuleId.trim().length === 0) {
      throw new ValidationError('Capsule ID is required');
    }

    // Fetch capsule
    const { data: capsule, error: fetchError } = await supabase
      .from('capsules')
      .select('*')
      .eq('id', capsuleId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !capsule) {
      throw new NotFoundError('Capsule not found');
    }

    // Check if capsule is locked - cannot edit after unlock
    const now = new Date();
    const unlockDate = new Date(capsule.unlock_date);
    const isLocked = now < unlockDate;

    if (isLocked) {
      logger.unauthorizedAccess(userId, `capsule:${capsuleId}`, 'Cannot edit locked capsule');
      throw new AuthorizationError(
        'Cannot edit capsule before unlock date'
      );
    }

    // Parse and validate update data
    const body = await request.json();

    // Only allow certain fields to be updated
    const updateFields: any = {};
    let hasUpdates = false;

    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length === 0) {
        throw new ValidationError('Title must be a non-empty string');
      }
      if (body.title.length > 255) {
        throw new ValidationError('Title must not exceed 255 characters');
      }
      updateFields.title = body.title.trim();
      hasUpdates = true;
    }

    if (body.message !== undefined) {
      if (typeof body.message !== 'string' || body.message.trim().length === 0) {
        throw new ValidationError('Message must be a non-empty string');
      }
      if (body.message.length > 50000) {
        throw new ValidationError('Message must not exceed 50,000 characters');
      }
      updateFields.message = body.message.trim();
      hasUpdates = true;
    }

    if (body.mood !== undefined) {
      const validMoods = ['Happy', 'Motivated', 'Confused', 'Sad', 'Grateful', 'Hopeful'];
      if (!validMoods.includes(body.mood)) {
        throw new ValidationError(`Mood must be one of: ${validMoods.join(', ')}`);
      }
      updateFields.mood = body.mood;
      hasUpdates = true;
    }

    if (body.photo_url !== undefined || body.photoURL !== undefined) {
      const photoUrl = body.photo_url ?? body.photoURL;
      if (photoUrl === null) {
        updateFields.photo_url = null;
        hasUpdates = true;
      } else {
        if (typeof photoUrl !== 'string') {
          throw new ValidationError('photo_url must be a string or null');
        }
        try {
          new URL(photoUrl);
          updateFields.photo_url = photoUrl;
          hasUpdates = true;
        } catch {
          throw new ValidationError('photo_url must be a valid URL');
        }
      }
    }

    // Prevent updating protected fields
    if (body.unlock_date !== undefined || body.unlockDate !== undefined) {
      logger.unauthorizedAccess(
        userId,
        `capsule:${capsuleId}`,
        'Attempted to modify unlock_date'
      );
      throw new ValidationError('Cannot modify unlock date after creation');
    }

    if (body.user_id !== undefined || body.userId !== undefined) {
      logger.unauthorizedAccess(userId, `capsule:${capsuleId}`, 'Attempted to modify user_id');
      throw new ValidationError('Cannot modify user ID');
    }

    if (body.created_at !== undefined || body.createdAt !== undefined) {
      logger.unauthorizedAccess(userId, `capsule:${capsuleId}`, 'Attempted to modify created_at');
      throw new ValidationError('Cannot modify creation date');
    }

    if (!hasUpdates) {
      return NextResponse.json(
        {
          success: true,
          data: { capsuleId },
          message: 'No changes made',
        },
        { status: 200 }
      );
    }

    // Update timestamp
    updateFields.updated_at = new Date().toISOString();

    // Update capsule
    const { data: updated, error: updateError } = await supabase
      .from('capsules')
      .update(updateFields)
      .eq('id', capsuleId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError || !updated) {
      if (updateError) {
        logger.error(updateError, { operation: 'update_capsule', userId });
      }
      throw new ServerError('Failed to update capsule');
    }

    logger.success('update_capsule', userId, { capsuleId });

    return NextResponse.json(
      {
        success: true,
        data: {
          capsuleId,
          updated_at: updated.updated_at,
        },
        message: 'Capsule updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}

/**
 * DELETE /api/capsules/[id] - Delete capsule
 * Hard delete from Supabase (RLS policies enforce authorization)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authenticate request
    const authRequest = await withAuth(request);
    const userId = authRequest.user?.id;

    if (!userId) {
      throw new AuthenticationError('User ID not found in token');
    }

    const resolvedParams = await params;
    const capsuleId = resolvedParams.id;

    // Validate capsule ID
    if (!capsuleId || capsuleId.trim().length === 0) {
      throw new ValidationError('Capsule ID is required');
    }

    // Fetch capsule to verify ownership
    const { data: capsule, error: fetchError } = await supabase
      .from('capsules')
      .select('id')
      .eq('id', capsuleId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !capsule) {
      throw new NotFoundError('Capsule not found');
    }

    // Delete capsule
    const { error: deleteError } = await supabase
      .from('capsules')
      .delete()
      .eq('id', capsuleId)
      .eq('user_id', userId);

    if (deleteError) {
      logger.error(deleteError, { operation: 'delete_capsule', userId });
      throw new ServerError('Failed to delete capsule');
    }

    logger.success('delete_capsule', userId, { capsuleId });

    return NextResponse.json(
      {
        success: true,
        data: {
          capsuleId,
          deletedAt: new Date().toISOString(),
        },
        message: 'Capsule deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}
