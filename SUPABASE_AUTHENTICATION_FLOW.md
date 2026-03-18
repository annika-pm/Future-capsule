# Authentication Flow - Supabase Integration

Complete documentation of the authentication flow for FutureCapsule with Supabase.

---

## **Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser / App                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  [LoginForm]                                                 │
│       │                                                      │
│       ├─→ supabase.auth.signInWithPassword()               │
│       │        or                                           │
│       ├─→ supabase.auth.signInWithOAuth('google')           │
│       │                                                      │
│       └─→ Supabase Auth (HTTPS)                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│                   Supabase Auth Service                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Validate email/password or OAuth token                  │
│  2. Generate JWT access token                               │
│  3. Store session token in cookies                          │
│  4. Return user data                                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│         API Routes / Backend (Next.js)                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  - Validate JWT token                                        │
│  - Extract user.id from token                               │
│  - Query PostgreSQL with RLS                                │
│  - RLS: WHERE user_id = auth.uid()                          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────────┐
│         PostgreSQL Database (Supabase)                      │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  - auth.users (managed by Supabase)                          │
│  - public.users (custom profile data)                        │
│  - public.capsules (with RLS enforcement)                    │
│  - RLS policies filter by user_id = auth.uid()              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## **1. User Signup (Email/Password)**

### Frontend Flow

```
User Input
  ↓
[SignupForm Component]
  ├─ Validate: email, password (8+ chars)
  ├─ Call: POST /api/auth/signup
  └─ Store: JWT session token
       ↓
    [Redirect to dashboard]
```

### Implementation

**Component: apps/future-capsule/src/components/auth/SignupForm.tsx**

```typescript
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@libs/supabase-config';

export function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      if (!email.includes('@')) {
        throw new Error('Invalid email');
      }

      // Call Supabase signup
      await signUp(email, password, displayName);

      // Redirect to dashboard (session is automatically stored)
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Display Name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password (8+ characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating account...' : 'Sign up'}
      </button>
    </form>
  );
}
```

### API Route: POST /api/auth/signup

(See [SUPABASE_API_ROUTES.md](SUPABASE_API_ROUTES.md) for full implementation)

```typescript
export async function POST(request: NextRequest) {
  const { email, password, displayName } = await request.json();

  // Validate
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  // Call Supabase Auth
  const { data, error } = await supabase.auth.signUpWithPassword({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // ✅ User created in auth.users
  // ✅ User profile created in public.users (via trigger)
  // ✅ JWT session returned

  return NextResponse.json({ user: data.user, session: data.session }, { status: 201 });
}
```

### Database Flow

1. **Supabase Auth** creates `auth.users` row
2. **Trigger** fires: `handle_new_user()`
3. **Public Users** inserted: `public.users(id, email, display_name, ...)`
4. **JWT** generated with `user.id`
5. **Session** stored in browser cookies

---

## **2. User Login (Email/Password)**

### Frontend Flow

```
User Input
  ↓
[LoginForm Component]
  ├─ Validate: email, password
  ├─ Call: supabase.auth.signInWithPassword()
  ├─ Session: Stored in cookies (automatic)
  └─ Redirect: /dashboard
```

### Implementation

**Component: apps/future-capsule/src/components/auth/LoginForm.tsx**

```typescript
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@libs/supabase-config';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Call Supabase signin
      await signIn(email, password);

      // Redirect to dashboard (session auto-stored)
      router.push('/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Log in'}
      </button>
    </form>
  );
}
```

### Flow

1. Supabase Auth validates credentials
2. JWT access token generated
3. Session stored in browser cookies
4. Request subsequent API calls with token

---

## **3. Google OAuth Login**

### Setup (See SUPABASE_SETUP_GUIDE.md Step 4.2)

1. Configure Google OAuth in Supabase
2. Get Client ID and Client Secret
3. Set redirect URI: `https://your-project.supabase.co/auth/v1/callback`

### Frontend Flow

```
User clicks "Sign in with Google"
  ↓
[GoogleSignInButton Component]
  ├─ Call: signInWithOAuth('google')
  ├─ Redirect: Google login page
  ├─ Google: User authenticates
  └─ Redirect back: /auth/callback?code=...
       ↓
    [useEffect in /auth/callback]
      ├─ Exchange code for session
      ├─ Store JWT in cookies
      └─ Redirect to /dashboard
```

### Implementation

**Component: apps/future-capsule/src/components/auth/GoogleSignInButton.tsx**

```typescript
import { useState } from 'react';
import { useAuth } from '@libs/supabase-config';

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signInWithGoogle } = useAuth();

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    try {
      // Redirect to Google login
      await signInWithGoogle();
      // Supabase will redirect back to /auth/callback
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Google login failed';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleClick} disabled={loading}>
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

**Callback Handler: apps/future-capsule/src/app/auth/callback/page.tsx**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@libs/supabase-config';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createBrowserClient();

      // Exchange code for session
      const { error } = await supabase.auth.exchangeCodeForSession(
        searchParams.get('code') || ''
      );

      if (error) {
        setError(error.message);
        return;
      }

      // Redirect to dashboard
      router.push('/dashboard');
    };

    handleCallback();
  }, []);

  if (error) {
    return <div>Authentication failed: {error}</div>;
  }

  return <div>Authenticating...</div>;
}
```

---

## **4. Session Management**

### How Sessions Work

```
┌─────────────────────────────────────────────────┐
│            Browser Storage                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  Cookies (HTTP-only):                          │
│  ├─ access_token : JWT (1 hour expiry)        │
│  └─ refresh_token : Long-lived (30 days)      │
│                                                 │
└─────────────────────────────────────────────────┘
       ↓
     Every API request
       ↓
┌─────────────────────────────────────────────────┐
│           Next.js API Route                     │
├─────────────────────────────────────────────────┤
│                                                 │
│  1. Extract JWT from cookies                   │
│  2. Verify JWT signature (using JWT secret)     │
│  3. Extract user.id from JWT payload           │
│  4. Use user.id in RLS queries                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Verify Session in API Route

```typescript
// Example API route
import { cookies } from 'next/headers';
import { createServerClient } from '@libs/supabase-config';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();

  // Create server client (handles JWT extraction)
  const supabase = createServerClient({
    getAll: () => cookieStore.getAll(),
  });

  // Get authenticated user
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // user.id is now available (JWT verified)
  console.log('Authenticated user:', user.id);

  // Use in RLS query
  const { data } = await supabase
    .from('capsules')
    .select('*')
    .eq('user_id', user.id); // RLS enforces this anyway

  return NextResponse.json({ capsules: data });
}
```

### Session Expiry & Refresh

Supabase automatically:
1. Expires access token after 1 hour
2. Uses refresh token to get new access token
3. Updates cookies with new tokens

**No manual handling needed!** Supabase client handles refresh automatically.

---

## **5. Logout**

### Frontend Flow

```
User clicks "Sign out"
  ↓
[useAuth hook]
  ├─ Call: supabase.auth.signOut()
  ├─ Remove session from cookies
  └─ Redirect: /login
```

### Implementation

```typescript
import { useAuth } from '@libs/supabase-config';

export function UserMenu() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      // Browser will redirect to /login
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return <button onClick={handleLogout}>Sign out</button>;
}
```

---

## **6. Protected Routes**

### Middleware to Check Auth

**File: apps/future-capsule/middleware.ts**

```typescript
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@libs/supabase-config';

export async function middleware(request: NextRequest) {
  // Protected routes
  const protectedRoutes = ['/dashboard', '/create', '/insights', '/timeline'];

  // Check if current path is protected
  const isProtected = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Create Supabase client
  const cookieStore = await cookies();
  const supabase = createServerClient({ ... });

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/create/:path*',
    '/insights/:path*',
    '/timeline/:path*',
  ],
};
```

---

## **7. Troubleshooting Auth Issues**

### Issue: "Unauthorized" on API calls

**Cause**: User not authenticated or session expired.

**Fix**:
```typescript
// In useAuth hook, check user before API call
const { user } = useAuth();

if (!user) {
  console.error('User not authenticated');
  router.push('/login');
  return;
}

// Then make API call
const response = await fetch('/api/capsules', {
  headers: {
    'Authorization': `Bearer ${user.session.access_token}`,
  },
});
```

### Issue: RLS policy blocks query

**Cause**: User ID mismatch or policy too restrictive.

**Fix**:
1. Check RLS policy in Supabase dashboard
2. Verify `auth.uid() = user_id` in policy
3. Test query with correct user context

```sql
-- Debug RLS
EXPLAIN (ANALYZE) 
SELECT * FROM public.capsules 
WHERE user_id = current_user_id();
```

### Issue: Google OAuth not working

**Cause**: Missing OAuth configuration.

**Fix**:
1. Go to Google Cloud Console → OAuth 2.0 Consent Screen
2. Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`
3. Copy Client ID and Secret to Supabase
4. Verify app domain is authorized

### Issue: Session not persisting

**Cause**: Cookies not being stored.

**Fix**:
```typescript
// Ensure cookies are enabled in browser
// Check DevTools → Application → Cookies → your domain

// Or use localStorage as fallback
const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    storage: localStorage, // Fallback storage
  },
});
```

---

## **Security Best Practices**

1. **Always verify JWT on backend** - Never trust frontend auth
2. **Use HTTPS only** - All auth traffic must be encrypted
3. **HTTP-only cookies** - Prevent XSS from stealing tokens
4. **Validate RLS policies** - Database layer enforces security
5. **Rotate keys regularly** - Quarterly or after incidents
6. **Monitor suspicious activity** - Check Supabase logs

---

## **References**

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **OAuth 2.0**: https://oauth.net/2/
- **JWT Tokens**: https://jwt.io/
- **Next.js Auth Helpers**: https://supabase.com/docs/guides/auth/auth-helpers/nextjs
