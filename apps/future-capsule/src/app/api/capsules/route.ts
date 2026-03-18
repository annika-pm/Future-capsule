/**
 * POST /api/capsules - Create a new capsule
 * GET /api/capsules - Fetch all capsules for authenticated user
 *
 * Both endpoints require Supabase JWT authentication token
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '@/middleware/auth-middleware';
import {
  ValidationError,
  ServerError,
  AuthenticationError,
  formatErrorResponse,
  logger,
} from '@/lib/errors';
import {
  validateCapsuleData,
  isValidUnlockDate,
} from '@/lib/capsule-unlock';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * POST /api/capsules - Create a new capsule
 *
 * Request body:
 * {
 *   title: string (1-255 chars)
 *   message: string (1-50000 chars)
 *   mood: 'Happy' | 'Motivated' | 'Confused' | 'Sad' | 'Grateful' | 'Hopeful'
 *   unlock_date: ISO timestamp string
 *   photo_url?: string (optional)
 * }
 *
 * Returns: { success: true, data: { id, createdAt, ... } }
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const authRequest = await withAuth(request);
    const userId = authRequest.user?.id;

    if (!userId) {
      throw new AuthenticationError('User ID not found in token');
    }

    // Parse request body
    const body = await request.json();

    // Normalize field names (handle both camelCase and snake_case)
    const normalizedData = {
      title: body.title,
      message: body.message,
      mood: body.mood,
      unlockDate: body.unlock_date || body.unlockDate,
      photoURL: body.photo_url || body.photoURL,
      latitude: body.latitude || null,
      longitude: body.longitude || null,
    };

    // Validate capsule data
    const validation = validateCapsuleData(normalizedData);
    if (!validation.valid) {
      logger.validationFail(userId, 'capsule_data', JSON.stringify(validation.errors));
      throw new ValidationError('Invalid capsule data', validation.errors);
    }

    // Validate unlock date specifically (must be future or today)
    const unlockDateValidation = isValidUnlockDate(normalizedData.unlockDate);
    if (!unlockDateValidation.valid) {
      logger.validationFail(userId, 'unlock_date', unlockDateValidation.error || 'Invalid');
      throw new ValidationError(unlockDateValidation.error || 'Invalid unlock date');
    }

    // Prepare capsule data
    const capsuleId = uuidv4();
    const now = new Date().toISOString();
    const unlockDate = new Date(normalizedData.unlockDate).toISOString();

    const capsuleData = {
      id: capsuleId,
      user_id: userId,
      title: (normalizedData.title || '').trim(),
      message: (normalizedData.message || '').trim(),
      mood: normalizedData.mood,
      unlock_date: unlockDate,
      photo_url: normalizedData.photoURL || null,
      latitude: normalizedData.latitude,
      longitude: normalizedData.longitude,
      created_at: now,
      updated_at: now,
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('capsules')
      .insert([capsuleData])
      .select()
      .single();

    if (error) {
      logger.error(error, { operation: 'create_capsule', userId });
      throw new ServerError(`Failed to create capsule: ${error.message}`);
    }

    // Return success response
    logger.success('create_capsule', userId, { capsuleId });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...data,
          isLocked: new Date() < new Date(data.unlock_date),
        },
        message: 'Capsule created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.statusCode,
    });
  }
}

/**
 * GET /api/capsules - Fetch all capsules for authenticated user
 *
 * Query parameters:
 * - status: 'locked' | 'unlocked' | 'opening-soon' | 'all' (default: 'all')
 * - sortBy: 'unlock_date' | 'created_at' (default: 'unlock_date')
 * - order: 'asc' | 'desc' (default: 'asc')
 * - limit: 1-100 (default: 50)
 * - offset: 0+ (default: 0)
 *
 * Returns: { success: true, data: { capsules: [...], pagination: {...} } }
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    const authRequest = await withAuth(request);
    const userId = authRequest.user?.id;

    if (!userId) {
      throw new AuthenticationError('User ID not found in token');
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = (searchParams.get('status') || 'all') as
      | 'locked'
      | 'unlocked'
      | 'opening-soon'
      | 'all';
    const sortBy = (searchParams.get('sortBy') || 'unlock_date') as string;
    const order = (searchParams.get('order') || 'asc') as 'asc' | 'desc';
    const limitParam = parseInt(searchParams.get('limit') || '50', 10);
    const offsetParam = parseInt(searchParams.get('offset') || '0', 10);

    // Validate query parameters
    const limit = Math.max(1, Math.min(limitParam, 100));
    const offset = Math.max(0, offsetParam);

    if (!['locked', 'unlocked', 'opening-soon', 'all'].includes(status)) {
      throw new ValidationError('Invalid status parameter', {
        status,
        validValues: ['locked', 'unlocked', 'opening-soon', 'all'],
      });
    }

    if (!['unlock_date', 'created_at'].includes(sortBy)) {
      throw new ValidationError('Invalid sortBy parameter', {
        sortBy,
        validValues: ['unlock_date', 'created_at'],
      });
    }

    if (!['asc', 'desc'].includes(order)) {
      throw new ValidationError('Invalid order parameter', {
        order,
        validValues: ['asc', 'desc'],
      });
    }

    // Build query
    let query = supabase
      .from('capsules')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Apply status filter
    const now = new Date();
    if (status === 'locked') {
      query = query.gt('unlock_date', now.toISOString());
    } else if (status === 'unlocked') {
      query = query.lte('unlock_date', now.toISOString());
    } else if (status === 'opening-soon') {
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      query = query
        .gt('unlock_date', now.toISOString())
        .lte('unlock_date', weekFromNow.toISOString());
    }

    // Apply sorting and pagination
    query = query
      .order(sortBy, { ascending: order === 'asc' })
      .range(offset, offset + limit - 1);

    // Execute query
    const { data: capsules, error, count } = await query;

    if (error) {
      logger.error(error, { operation: 'list_capsules', userId });
      throw new ServerError(`Failed to fetch capsules: ${error.message}`);
    }

    // Format capsules for response
    const formattedCapsules = (capsules || []).map(capsule => {
      const unlockTime = new Date(capsule.unlock_date);
      const isLocked = now < unlockTime;

      const response: any = {
        id: capsule.id,
        user_id: capsule.user_id,
        title: capsule.title,
        mood: capsule.mood,
        unlock_date: capsule.unlock_date,
        photo_url: capsule.photo_url,
        latitude: capsule.latitude,
        longitude: capsule.longitude,
        created_at: capsule.created_at,
        updated_at: capsule.updated_at,
        isLocked,
      };

      // Only include message if unlocked
      if (!isLocked) {
        response.message = capsule.message;
      }

      return response;
    });

    logger.success('list_capsules', userId, {
      count: formattedCapsules.length,
      status,
      total: count,
    });

    return NextResponse.json(
      {
        success: true,
        capsules: formattedCapsules,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: offset + limit < (count || 0),
        },
        message: 'Capsules retrieved successfully',
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
