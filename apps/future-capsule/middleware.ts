/**
 * Next.js Middleware for FutureCapsule
 * 
 * Handles authentication-based route protection and redirects.
 * Note: Firebase Auth runs client-side, so middleware works with:
 * - Redirecting authenticated users away from auth pages
 * - Redirecting unauthenticated users to login (via client-side ProtectedLayout)
 */

import { NextRequest, NextResponse } from 'next/server';

// Routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/'];

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/timeline', '/create', '/capsule'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow all routes - client-side auth will handle protection
  // This middleware is mainly for future server-side validation
  
  // Check if accessing public auth routes
  const isPublicRoute = publicRoutes.includes(pathname);
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Note: Since Firebase Auth is client-side only, we can't validate tokens here.
  // Route protection is handled by:
  // 1. Root page (/) redirects based on auth state
  // 2. ProtectedLayout component checks auth for protected pages
  // 3. Users can't access protected data in Firestore without auth token

  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
