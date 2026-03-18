/**
 * Authentication utilities
 * Provides helpers for token management and auth operations
 */

import { supabase } from './supabase';

/**
 * Get the current user's auth token
 * @throws Error if no active session exists
 */
export async function getAuthToken(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    throw new Error('No active authentication session. Please log in.');
  }

  return session.access_token;
}

/**
 * Get the current user
 */
export async function getUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data } = await supabase.auth.getUser();
  return !!data.user;
}
