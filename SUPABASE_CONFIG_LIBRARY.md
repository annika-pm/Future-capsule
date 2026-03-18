# Supabase Configuration Library - Nx Structure

Type-safe Supabase client library for FutureCapsule. Creates `libs/supabase-config/` with proper TypeScript support.

---

## **Project Structure**

```
libs/supabase-config/
├── project.json              # Nx project configuration
├── tsconfig.json             # TypeScript configuration
├── README.md                 # Library documentation
└── src/
    ├── index.ts              # Public exports
    ├── client.ts             # Supabase client instances
    ├── types.ts              # Shared TypeScript types
    ├── hooks/
    │   ├── index.ts
    │   ├── useAuth.ts        # useAuth hook
    │   ├── useCapsules.ts    # useCapsules hook
    │   └── useUser.ts        # useUser hook
    └── utils/
        ├── index.ts
        └── validation.ts     # Input validation
```

---

## **File 1: libs/supabase-config/project.json**

```json
{
  "name": "supabase-config",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/supabase-config/src",
  "prefix": "lib",
  "projectType": "library",
  "targets": {
    "lint": {
      "executor": "@nx/linter:eslint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": [
          "libs/supabase-config/**/*.ts",
          "libs/supabase-config/**/*.tsx"
        ]
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "libs/supabase-config/jest.config.ts",
        "passWithNoTests": true
      }
    }
  },
  "tags": [
    "scope:libs",
    "type:library",
    "type:config"
  ]
}
```

---

## **File 2: libs/supabase-config/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "declaration": true,
    "declarationDir": "../../dist/out-tsc",
    "declarationMap": true,
    "inlineSources": true,
    "types": ["jest", "node"]
  },
  "files": ["src/index.ts"],
  "include": [
    "src/**/*.ts"
  ],
  "references": [
    {
      "path": "./tsconfig.spec.json"
    }
  ]
}
```

---

## **File 3: libs/supabase-config/src/index.ts**

Main export file for the library.

```typescript
/**
 * Supabase Configuration Library
 * Type-safe Supabase client initialization and utilities for FutureCapsule
 */

// Clients
export {
  createBrowserClient,
  createServerClient,
  createAdminClient,
} from './client';

// Hooks
export { useAuth } from './hooks/useAuth';
export { useCapsules } from './hooks/useCapsules';
export { useUser } from './hooks/useUser';

// Types
export type {
  User,
  Capsule,
  CapsuleStatus,
  Mood,
  MoodStats,
  Database,
} from './types';

// Validation utilities
export {
  validateCapsuleInput,
  validateUserInput,
  validateMood,
} from './utils/validation';
```

---

## **File 4: libs/supabase-config/src/types.ts**

TypeScript type definitions for Supabase schema.

```typescript
/**
 * Type definitions for Supabase schema
 * Matches PostgreSQL schema in libs/firebase/firestore-schema.md
 */

export type Mood = 'Happy' | 'Motivated' | 'Confused' | 'Sad' | 'Grateful' | 'Hopeful';
export type CapsuleStatus = 'draft' | 'scheduled' | 'unlocked' | 'archived';

/**
 * User profile (extends Supabase auth.users)
 */
export interface User {
  id: string; // UUID
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  timezone?: string | null;
  emailNotifications: boolean;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: string; // ISO 8601 datetime
  updatedAt: string; // ISO 8601 datetime
}

/**
 * Capsule (time capsule)
 */
export interface Capsule {
  id: string; // UUID
  userId: string; // UUID
  title: string;
  message: string;
  mood: Mood;
  unlockDate: string; // ISO 8601 datetime
  photoURL?: string | null;
  status: CapsuleStatus;
  isDeleted: boolean;
  createdAt: string; // ISO 8601 datetime
  updatedAt: string; // ISO 8601 datetime
  // Computed properties (not stored)
  isUnlocked?: boolean;
  daysUntilUnlock?: number;
  canEdit?: boolean;
}

/**
 * Mood statistics
 */
export interface MoodStats {
  id: string; // UUID
  userId: string; // UUID
  mood: Mood;
  count: number;
  date: string; // ISO 8601 date (YYYY-MM-DD)
  createdAt: string; // ISO 8601 datetime
}

/**
 * Capsule list item (message hidden for locked capsules)
 */
export interface CapsuleListItem extends Omit<Capsule, 'message'> {
  message?: string;
}

/**
 * Supabase database type definitions
 * Generated from PostgreSQL schema
 */
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<User, 'id' | 'createdAt'>>;
      };
      capsules: {
        Row: Capsule;
        Insert: Omit<Capsule, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Capsule, 'id' | 'createdAt'>>;
      };
      mood_stats: {
        Row: MoodStats;
        Insert: Omit<MoodStats, 'id' | 'createdAt'>;
        Update: Partial<MoodStats>;
      };
    };
  };
}
```

---

## **File 5: libs/supabase-config/src/client.ts**

Create Supabase client instances for different contexts.

```typescript
/**
 * Supabase client initialization
 * Provides separate clients for browser, server, and admin contexts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Validate environment variables
 */
function validateEnvVariables() {
  const missing = [];

  if (!supabaseUrl) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!supabaseAnonKey) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Please check your .env.local or Vercel environment configuration.`
    );
  }
}

/**
 * Create Supabase client for browser (frontend)
 * Uses anonymous key (respects RLS)
 */
export function createBrowserClient(): SupabaseClient<Database> {
  validateEnvVariables();

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

/**
 * Create Supabase client for server-side operations
 * Uses anonymous key but with proper authentication context
 */
export function createServerClient(
  cookieHandler?: {
    getAll: () => Array<{ name: string; value: string }>;
    setAll?: (cookies: Array<{ name: string; value: string }>) => void;
  }
): SupabaseClient<Database> {
  validateEnvVariables();

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    cookies: cookieHandler,
  });
}

/**
 * Create Supabase admin client for backend operations
 * Uses service role key (bypasses RLS)
 * NEVER expose this to frontend!
 */
export function createAdminClient(): SupabaseClient<Database> {
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY not configured. ' +
      'Admin client can only be created server-side.'
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Get authentication context from cookies (server-side only)
 */
export async function getAuthUser(cookies?: any) {
  try {
    const supabase = createServerClient({ getAll: () => cookies?.getAll?.() ?? [] });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Failed to get auth user:', error);
    return null;
  }
}
```

---

## **File 6: libs/supabase-config/src/hooks/useAuth.ts**

React hook for authentication state management.

```typescript
/**
 * useAuth - React hook for authentication state
 */

import { useEffect, useState, useCallback } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { createBrowserClient } from '../client';

export interface AuthState {
  user: SupabaseUser | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to manage auth state and provide sign in/out methods
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  const supabase = createBrowserClient();

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setState({
          user,
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          user: null,
          loading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        loading: false,
        error: null,
      });
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName?: string) => {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        const { data, error } = await supabase.auth.signUpWithPassword({
          email,
          password,
          options: {
            data: {
              display_name: displayName || email,
            },
          },
        });

        if (error) throw error;

        setState({
          user: data.user,
          loading: false,
          error: null,
        });

        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err,
        }));
        throw err;
      }
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      setState((prev) => ({ ...prev, loading: true }));
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setState({
          user: data.user,
          loading: false,
          error: null,
        });

        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err,
        }));
        throw err;
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setState({
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err,
      }));
      throw err;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err,
      }));
      throw err;
    }
  }, []);

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
  };
}
```

---

## **File 7: libs/supabase-config/src/hooks/useCapsules.ts**

React hook for capsule operations.

```typescript
/**
 * useCapsules - React hook for managing capsules
 */

import { useCallback, useState, useEffect } from 'react';
import { createBrowserClient } from '../client';
import type { Capsule, CapsuleListItem } from '../types';

export interface UseCapsules {
  capsules: Capsule[];
  loading: boolean;
  error: Error | null;
  fetchCapsules: (limit?: number, offset?: number) => Promise<void>;
  getCapsule: (id: string) => Promise<Capsule | null>;
  createCapsule: (capsule: Omit<Capsule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Capsule>;
  updateCapsule: (id: string, updates: Partial<Capsule>) => Promise<Capsule>;
  deleteCapsule: (id: string) => Promise<void>;
}

export function useCapsules(): UseCapsules {
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const supabase = createBrowserClient();

  // const fetchCapsules = useCallback(async (limit = 20, offset = 0) => {
  //   setLoading(true);
  //   try {
  //     const response = await fetch(`/api/capsules?limit=${limit}&offset=${offset}`);
  //     if (!response.ok) throw new Error('Failed to fetch capsules');

  //     const data = await response.json();
  //     setCapsules(data.capsules);
  //     setError(null);
  //   } catch (err) {
  //     const error = err instanceof Error ? err : new Error(String(err));
  //     setError(error);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);

  import { supabase } from '@/lib/supabase';

  const fetchCapsules = useCallback(async (limit = 20, offset = 0) => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log("fetch capsule : ",session?.access_token)
      if (!session) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(`/api/capsules?limit=${limit}&offset=${offset}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch capsules");
      }

      const data = await response.json();
      setCapsules(data.capsules);
      setError(null);

    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }

  }, []);

  const getCapsule = useCallback(async (id: string): Promise<Capsule | null> => {
    try {
      const response = await fetch(`/api/capsules/${id}`);
      if (!response.ok) return null;

      return await response.json();
    } catch {
      return null;
    }
  }, []);

  const createCapsule = useCallback(
    async (capsule: Omit<Capsule, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const response = await fetch('/api/capsules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(capsule),
        });

        if (!response.ok) throw new Error('Failed to create capsule');

        const data = await response.json();
        setCapsules((prev) => [data.capsule, ...prev]);
        return data.capsule;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    []
  );

  const updateCapsule = useCallback(async (id: string, updates: Partial<Capsule>) => {
    try {
      const response = await fetch(`/api/capsules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update capsule');

      const data = await response.json();
      setCapsules((prev) =>
        prev.map((c) => (c.id === id ? data.capsule : c))
      );
      return data.capsule;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  const deleteCapsule = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/capsules/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete capsule');

      setCapsules((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  return {
    capsules,
    loading,
    error,
    fetchCapsules,
    getCapsule,
    createCapsule,
    updateCapsule,
    deleteCapsule,
  };
}
```

---

## **File 8: libs/supabase-config/src/hooks/useUser.ts**

React hook for user profile operations.

```typescript
/**
 * useUser - React hook for user profile management
 */

import { useCallback, useState, useEffect } from 'react';
import type { User } from '../types';

export interface UseUser {
  user: User | null;
  loading: boolean;
  error: Error | null;
  fetchUser: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
}

export function useUser(): UseUser {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user');
      if (!response.ok) throw new Error('Failed to fetch user');

      const data = await response.json();
      setUser(data.user);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update user');

      const data = await response.json();
      setUser(data.user);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, []);

  return { user, loading, error, fetchUser, updateUser };
}
```

---

## **File 9: libs/supabase-config/src/utils/validation.ts**

Input validation utilities.

```typescript
/**
 * Input validation utilities
 */

import type { Capsule, Mood, User } from '../types';

export const VALID_MOODS: Mood[] = [
  'Happy',
  'Motivated',
  'Confused',
  'Sad',
  'Grateful',
  'Hopeful',
];

export function validateMood(mood: string): mood is Mood {
  return VALID_MOODS.includes(mood as Mood);
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateCapsuleInput(capsule: Partial<Capsule>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!capsule.title || capsule.title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Title is required' });
  } else if (capsule.title.length > 255) {
    errors.push({ field: 'title', message: 'Title must be less than 255 characters' });
  }

  if (!capsule.message || capsule.message.trim().length === 0) {
    errors.push({ field: 'message', message: 'Message is required' });
  } else if (capsule.message.length < 10) {
    errors.push({ field: 'message', message: 'Message must be at least 10 characters' });
  } else if (capsule.message.length > 10000) {
    errors.push({ field: 'message', message: 'Message must be less than 10,000 characters' });
  }

  if (!capsule.mood) {
    errors.push({ field: 'mood', message: 'Mood is required' });
  } else if (!validateMood(capsule.mood)) {
    errors.push({
      field: 'mood',
      message: `Mood must be one of: ${VALID_MOODS.join(', ')}`,
    });
  }

  if (!capsule.unlockDate) {
    errors.push({ field: 'unlockDate', message: 'Unlock date is required' });
  } else if (new Date(capsule.unlockDate) <= new Date()) {
    errors.push({ field: 'unlockDate', message: 'Unlock date must be in the future' });
  }

  return errors;
}

export function validateUserInput(user: Partial<User>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (user.displayName && user.displayName.length > 255) {
    errors.push({
      field: 'displayName',
      message: 'Display name must be less than 255 characters',
    });
  }

  if (user.timezone) {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: user.timezone });
    } catch {
      errors.push({ field: 'timezone', message: 'Invalid timezone' });
    }
  }

  return errors;
}
```

---

## **Usage in Components**

```typescript
// Example component using the hooks

import { useAuth, useCapsules, useUser } from '@libs/supabase-config';

export function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { capsules, loading: capsulesLoading, fetchCapsules } = useCapsules();
  const { user: profile, updateUser } = useUser();

  useEffect(() => {
    if (user) {
      fetchCapsules();
    }
  }, [user]);

  if (authLoading || capsulesLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Hello, {profile?.displayName}</h1>
      <div>
        {capsules.map((capsule) => (
          <div key={capsule.id}>
            <h3>{capsule.title}</h3>
            <p>Mood: {capsule.mood}</p>
            {!capsule.isUnlocked && (
              <p>{capsule.daysUntilUnlock} days until unlock</p>
            )}
          </div>
        ))}
      </div>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

---

## **References**

- **Supabase JavaScript SDK**: https://supabase.com/docs/reference/javascript
- **TypeScript Support**: https://supabase.com/docs/guides/api/generating-types
- **Nx Library Documentation**: https://nx.dev/concepts/more-concepts/monorepos/monorepo-structure
