'use client';

import { useEffect } from 'react';

/**
 * Suppresses non-critical Supabase auth errors that occur when checking for sessions
 * This is expected behavior when no user is logged in.
 */
export function ErrorSuppressor() {
  useEffect(() => {
    // Suppress "Auth session missing" error which is expected when user is not logged in
    const originalError = window.console.error;
    window.console.error = (...args: any[]) => {
      const message = String(args[0] || '');
      
      // Suppress this specific Supabase auth error
      if (message.includes('Auth session missing')) {
        return;
      }
      
      // Suppress the stack trace that follows if it's part of the auth error
      if (args[0] instanceof Error && args[0].message?.includes('Auth session missing')) {
        return;
      }
      
      originalError.apply(window.console, args);
    };

    return () => {
      window.console.error = originalError;
    };
  }, []);

  return null;
}
