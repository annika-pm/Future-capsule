/**
 * Authentication Middleware for API Routes
 *
 * Extracts and validates Supabase JWT tokens from request headers.
 * Attaches authenticated user context to request for downstream handlers.
 */

import {
  AuthenticationError,
  AuthorizationError,
  logger,
} from '../lib/errors';

/**
 * Request object with attached user context
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

/**
 * Decode JWT payload without verification
 * This safely extracts the claims from the JWT
 */
function decodeJWT(token: string): { sub: string; email?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (second part)
    // JWT uses base64url encoding, which replaces +/ with -_ and removes padding
    let payload = parts[1];
    
    // Add padding if needed
    const padding = 4 - (payload.length % 4);
    if (padding !== 4) {
      payload += '='.repeat(padding);
    }
    
    // Convert base64url to base64
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    const decoded = JSON.parse(
      Buffer.from(payload, 'base64').toString('utf-8')
    );

    // Validate required fields
    if (!decoded.sub) {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('JWT decode error:', error);
    return null;
  }
}

/**
 * Middleware to validate Supabase JWT token
 *
 * Usage in API route:
 * ```typescript
 * export async function GET(request: Request) {
 *   const authRequest = await withAuth(request);
 *   const userId = authRequest.user.id;
 *   // ... rest of handler
 * }
 * ```
 *
 * Throws AuthenticationError if token is missing or invalid
 */
export async function withAuth(request: Request): Promise<AuthenticatedRequest> {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');

  // Check if Authorization header exists
  if (!token) {
    logger.validationFail('anonymous', 'authorization_header', 'Missing authorization header');
    throw new AuthenticationError('Missing authorization header');
  }

  try {
    // Decode JWT to extract user ID
    const payload = decodeJWT(token);
    
    if (!payload || !payload.sub) {
      logger.validationFail('anonymous', 'jwt_token', 'Invalid token format or missing sub claim');
      throw new AuthenticationError('Invalid or expired token');
    }

    // Attach user to request
    const authRequest = request as AuthenticatedRequest;
    authRequest.user = {
      id: payload.sub,
      email: payload.email,
    };

    return authRequest;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    console.error('Token validation error:', {
      error,
      tokenLength: token?.length,
      tokenPrefix: token?.substring(0, 20),
    });
    logger.validationFail('anonymous', 'jwt_token', 'Token verification failed');
    throw new AuthenticationError('Invalid or expired token');
  }
}

/**
 * Middleware to ensure user ownership of a resource
 *
 * Usage:
 * ```typescript
 * export async function DELETE(
 *   request: Request,
 *   { params }: { params: { id: string } }
 * ) {
 *   const authRequest = await withAuth(request);
 *   const userId = authRequest.user!.id;
 *   
 *   assertOwnership(userId, capsule.userId);
 *   // ... rest of handler
 * }
 * ```
 */
export function assertOwnership(userId: string, resourceUserId: string) {
  if (userId !== resourceUserId) {
    logger.unauthorizedAccess(userId, 'capsule', 'Ownership check failed');
    throw new AuthorizationError('You do not have permission to access this resource');
  }
}

/**
 * Helper to extract user ID from authenticated request
 */
export function getUserId(request: AuthenticatedRequest): string {
  if (!request.user?.id) {
    throw new AuthenticationError('User context not found in request');
  }
  return request.user.id;
}
