'use client';

import { supabase } from './supabase';

/**
 * Diagnoses Supabase connectivity and configuration issues
 */
export async function diagnosticsSupabaseConnection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const report: Record<string, any> = {
    timestamp: new Date().toISOString(),
    url,
    hasAnonKey: !!anonKey,
  };

  try {
    // Test 1: Check if Supabase URL is reachable
    const healthResponse = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': anonKey || '',
      },
      mode: 'cors',
    });

    report.healthCheck = {
      reachable: healthResponse.ok,
      status: healthResponse.status,
      statusText: healthResponse.statusText,
    };
  } catch (error: any) {
    report.healthCheckError = {
      message: error.message,
      type: error.name,
    };
  }

  try {
    // Test 2: Try to get current user (should return error if no session, not network error)
    const { data, error } = await supabase.auth.getUser();
    report.authTest = {
      hasUser: !!data.user,
      error: error?.message,
    };
  } catch (error: any) {
    report.authTestError = {
      message: error.message,
      type: error.name,
    };
  }

  // Test 3: Check environment variables
  report.config = {
    supabaseUrlValid: url?.startsWith('https://'),
    anonKeyValid:
      anonKey?.startsWith('eyJ') && anonKey?.includes('.') ? 'JWT format OK' : 'INVALID FORMAT',
  };

  return report;
}

/**
 * User-friendly error message for common Supabase issues
 */
export function getSupabaseErrorMessage(error: any): string {
  const message = error?.message?.toLowerCase() || '';

  if (message.includes('failed to fetch') || message.includes('network')) {
    return `Network error: Unable to reach Supabase. 
    
Possible causes:
- Supabase project is paused (free tier auto-pauses after 1 week)
- Network connectivity issue
- Firewall/CORS blocking the request

Action: Check your Supabase dashboard at https://app.supabase.com - if paused, click to resume the project.`;
  }

  if (message.includes('invalid api key') || message.includes('invalid credentials')) {
    return `Authentication error: Invalid Supabase credentials.

Check your .env.local file for:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY`;
  }

  if (message.includes('user already exists')) {
    return 'This email is already registered. Try logging in instead.';
  }

  if (message.includes('invalid') && message.includes('password')) {
    return 'Password must be at least 6 characters.';
  }

  return error?.message || 'An unexpected error occurred. Please try again.';
}
