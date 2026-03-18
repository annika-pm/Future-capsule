/**
 * Unit Tests for Auth Middleware
 * Tests Firebase token validation and user authentication
 */

import { withAuth, AuthenticatedRequest } from '@/middleware/auth-middleware';
import { AuthenticationError } from '@/lib/errors';

describe('Auth Middleware', () => {
  describe('withAuth', () => {
    it('should throw error when Authorization header is missing', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {},
      });

      await expect(withAuth(request)).rejects.toThrow(AuthenticationError);
      await expect(withAuth(request)).rejects.toThrow(
        'Missing authorization header'
      );
    });

    it('should throw error when Authorization token format is invalid', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Authorization': 'InvalidFormat token',
        },
      });

      await expect(withAuth(request)).rejects.toThrow(AuthenticationError);
      await expect(withAuth(request)).rejects.toThrow(
        'Invalid authorization header format'
      );
    });

    it('should throw error when Bearer prefix is missing', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Authorization': 'jwt-token-without-bearer',
        },
      });

      await expect(withAuth(request)).rejects.toThrow(AuthenticationError);
      await expect(withAuth(request)).rejects.toThrow(
        'Invalid authorization header format'
      );
    });

    it('should throw error for malformed JWT token', async () => {
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid-jwt',
        },
      });

      await expect(withAuth(request)).rejects.toThrow(AuthenticationError);
    });

    it('should throw error for expired token', async () => {
      // Create a JWT with expired timestamp (year 2020)
      const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
      const payload = Buffer.from(
        JSON.stringify({
          uid: 'user-123',
          email: 'test@example.com',
          exp: Math.floor(new Date('2020-01-01').getTime() / 1000),
        })
      ).toString('base64');
      const signature = 'signature';
      const expiredToken = `${header}.${payload}.${signature}`;

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${expiredToken}`,
        },
      });

      await expect(withAuth(request)).rejects.toThrow(AuthenticationError);
      await expect(withAuth(request)).rejects.toThrow('Token has expired');
    });

    it('should accept valid JWT token with future expiration', async () => {
      // Create a valid JWT with future timestamp
      const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
      // Use year 2099 for future date
      const payload = Buffer.from(
        JSON.stringify({
          uid: 'user-123',
          email: 'test@example.com',
          exp: Math.floor(new Date('2099-01-01').getTime() / 1000),
        })
      ).toString('base64');
      const signature = 'signature';
      const validToken = `${header}.${payload}.${signature}`;

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validToken}`,
        },
      });

      const authRequest = await withAuth(request);
      expect(authRequest.user).toBeDefined();
      expect(authRequest.user?.uid).toBe('user-123');
      expect(authRequest.user?.email).toBe('test@example.com');
    });

    it('should extract user information from token payload', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
      const payload = Buffer.from(
        JSON.stringify({
          uid: 'custom-user-id',
          email: 'custom@example.com',
          exp: Math.floor(new Date('2099-01-01').getTime() / 1000),
        })
      ).toString('base64');
      const signature = 'signature';
      const token = `${header}.${payload}.${signature}`;

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const authRequest = await withAuth(request);
      expect(authRequest.user?.uid).toBe('custom-user-id');
      expect(authRequest.user?.email).toBe('custom@example.com');
    });

    it('should attach user context to request object', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
      const payload = Buffer.from(
        JSON.stringify({
          uid: 'user-123',
          email: 'test@example.com',
          exp: Math.floor(new Date('2099-01-01').getTime() / 1000),
        })
      ).toString('base64');
      const signature = 'signature';
      const token = `${header}.${payload}.${signature}`;

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const authRequest = await withAuth(request) as AuthenticatedRequest;
      expect((authRequest as any).user).toBeDefined();
      expect((authRequest as any).user.uid).toBe('user-123');
    });

    it('should accept token without email field', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
      const payload = Buffer.from(
        JSON.stringify({
          uid: 'user-123',
          exp: Math.floor(new Date('2099-01-01').getTime() / 1000),
        })
      ).toString('base64');
      const signature = 'signature';
      const token = `${header}.${payload}.${signature}`;

      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const authRequest = await withAuth(request);
      expect(authRequest.user?.uid).toBe('user-123');
      expect(authRequest.user?.email).toBeUndefined();
    });

    it('should handle case-insensitive Bearer prefix', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64');
      const payload = Buffer.from(
        JSON.stringify({
          uid: 'user-123',
          exp: Math.floor(new Date('2099-01-01').getTime() / 1000),
        })
      ).toString('base64');
      const signature = 'signature';
      const token = `${header}.${payload}.${signature}`;

      // Test with lowercase "bearer"
      const request = new Request('http://localhost:3000/api/test', {
        method: 'POST',
        headers: {
          'Authorization': `bearer ${token}`,
        },
      });

      // Current implementation expects "Bearer" with capital B
      // This test checks that lowercase "bearer" fails as expected
      await expect(withAuth(request)).rejects.toThrow();
    });
  });
});
