'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    // const checkUser = async () => {
    //   try {
    //     //const { data, error: authError } = await supabase.auth.getUser();
        
    //     const { data: { session } } = await supabase.auth.getSession();

    //   setUser(session?.user ?? null);
    //     if (authError) {
    //       // "session_not_found" is expected when user is not logged in
    //       if (authError.message !== 'Auth session missing!') {
    //         setError(authError.message);
    //       }
    //       setUser(null);
    //       return;
    //     }
    //     setUser(data.user);
    //   } catch (err: any) {
    //     setUser(null);
    //     setError(err.message);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log('Auth session:', session);
        setUser(session?.user ?? null);
        setSession(session);
      } catch (err: any) {
        setUser(null);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signup = async (email: string, password: string, displayName?: string) => {
    try {
      setError(null);
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });

      if (signupError) throw signupError;
      setUser(data.user);
      return data.user;
    } catch (err: any) {
      const { getSupabaseErrorMessage } = await import('@/lib/supabase-diagnostics');
      const message = getSupabaseErrorMessage(err);
      setError(message);
      console.error('Signup error:', err);
      throw new Error(message);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;
      setUser(data.user);
      return data.user;
    } catch (err: any) {
      const { getSupabaseErrorMessage } = await import('@/lib/supabase-diagnostics');
      const message = getSupabaseErrorMessage(err);
      setError(message);
      console.error('Login error:', err);
      throw new Error(message);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
        },
      });

      if (googleError) throw googleError;
    } catch (err: any) {
      const message = err.message || 'Google sign-in failed';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      const { error: logoutError } = await supabase.auth.signOut();
      if (logoutError) throw logoutError;
      setUser(null);
      router.push('/login');
    } catch (err: any) {
      const message = err.message || 'Logout failed';
      setError(message);
      throw new Error(message);
    }
  };

  return {
    user,
    session,
    isLoading,
    error,
    signup,
    login,
    signInWithGoogle,
    logout,
    isAuthenticated: !!user,
  };
};

