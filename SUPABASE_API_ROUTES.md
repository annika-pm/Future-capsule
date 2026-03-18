# Supabase API Routes - Next.js Implementation

Production-ready API routes for FutureCapsule using Supabase backend with Next.js API routes.

---

## **Architecture Overview**

```
Frontend (useAuth, useCapsules hooks)
         ↓
Next.js API Routes (/api/*)
         ↓
Supabase Client (with auth validation)
         ↓
PostgreSQL (with RLS)
```

**Why API Routes?**
- Backend validation of unlock dates
- Service role key available (cannot expose to frontend)
- Rate limiting and security
- Request/response transformation

---

## **Setup: Install Supabase Client**

```bash
npm install @supabase/supabase-js
```

---

## **Route 1: GET /api/user**

**Purpose**: Get authenticated user profile.

**File**: `apps/future-capsule/src/app/api/user/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, serializeCookieHeader } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client for server-side
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // Updates from middleware
          },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: authUser.id,
        email: authUser.email,
        displayName: userProfile.display_name,
        photoURL: userProfile.photo_url,
        createdAt: new Date(userProfile.created_at).getTime(),
      },
    });
  } catch (error) {
    console.error('GET /api/user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "John Doe",
    "photoURL": "https://...",
    "createdAt": 1234567890
  }
}
```

---

## **Route 2: PUT /api/user**

**Purpose**: Update user profile (display name, timezone, etc).

**File**: `apps/future-capsule/src/app/api/user/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface UpdateUserRequest {
  displayName?: string;
  timezone?: string;
  emailNotifications?: boolean;
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    // Authenticate user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: UpdateUserRequest = await request.json();

    // Validate input
    if (body.displayName && body.displayName.length > 255) {
      return NextResponse.json(
        { error: 'displayName must be less than 255 characters' },
        { status: 400 }
      );
    }

    if (body.timezone && !isValidTimezone(body.timezone)) {
      return NextResponse.json(
        { error: 'Invalid timezone' },
        { status: 400 }
      );
    }

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        display_name: body.displayName || undefined,
        timezone: body.timezone || undefined,
        email_notifications: body.emailNotifications !== undefined ? body.emailNotifications : undefined,
      })
      .eq('id', authUser.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update user error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error('PUT /api/user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Validate timezone
function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
```

---

## **Route 3: POST /api/capsules**

**Purpose**: Create a new capsule.

**File**: `apps/future-capsule/src/app/api/capsules/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

interface CreateCapsuleRequest {
  title: string;
  message: string;
  mood: string;
  unlockDate: number; // Unix timestamp in milliseconds
  photoURL?: string;
}

const MOOD_VALUES = ['Happy', 'Motivated', 'Confused', 'Sad', 'Grateful', 'Hopeful'];

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    // Authenticate user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request
    const body: CreateCapsuleRequest = await request.json();

    // Validate required fields
    if (!body.title || !body.message || !body.mood || !body.unlockDate) {
      return NextResponse.json(
        { error: 'Missing required fields: title, message, mood, unlockDate' },
        { status: 400 }
      );
    }

    // Validate title length
    if (body.title.length < 1 || body.title.length > 255) {
      return NextResponse.json(
        { error: 'Title must be between 1-255 characters' },
        { status: 400 }
      );
    }

    // Validate message length
    if (body.message.length < 10 || body.message.length > 10000) {
      return NextResponse.json(
        { error: 'Message must be between 10-10000 characters' },
        { status: 400 }
      );
    }

    // Validate mood
    if (!MOOD_VALUES.includes(body.mood)) {
      return NextResponse.json(
        { error: `Invalid mood. Must be one of: ${MOOD_VALUES.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate unlock date (must be in future)
    const unlockDate = new Date(body.unlockDate);
    if (unlockDate <= new Date()) {
      return NextResponse.json(
        { error: 'Unlock date must be in the future' },
        { status: 400 }
      );
    }

    // Validate photoURL if provided
    if (body.photoURL) {
      try {
        new URL(body.photoURL);
      } catch {
        return NextResponse.json(
          { error: 'Invalid photo URL' },
          { status: 400 }
        );
      }
    }

    // Create capsule
    const capsuleId = uuidv4();
    const { data: capsule, error: createError } = await supabase
      .from('capsules')
      .insert({
        id: capsuleId,
        user_id: authUser.id,
        title: body.title,
        message: body.message,
        mood: body.mood,
        unlock_date: new Date(body.unlockDate).toISOString(),
        photo_url: body.photoURL || null,
        status: 'scheduled',
      })
      .select()
      .single();

    if (createError) {
      console.error('Create capsule error:', createError);
      return NextResponse.json(
        { error: 'Failed to create capsule' },
        { status: 500 }
      );
    }

    // Sync mood stats (aggregate capsules)
    await supabase.rpc('sync_mood_stats_for_user', { user_uuid: authUser.id });

    return NextResponse.json(
      { capsule },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/capsules error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/capsules - List user's capsules
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    // Authenticate
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const searchParams = new URL(request.url).searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);
    const sortBy = searchParams.get('sortBy') || 'created_at'; // created_at, unlock_date

    // Validate sortBy
    const allowedSorts = ['created_at', 'unlock_date'];
    const validSortBy = allowedSorts.includes(sortBy) ? sortBy : 'created_at';

    // Fetch capsules (RLS automatically filters by user_id)
    const { data: capsules, error: fetchError } = await supabase
      .from('capsules')
      .select('*', { count: 'exact' })
      .eq('user_id', authUser.id)
      .eq('is_deleted', false)
      .order(validSortBy, { ascending: validSortBy === 'unlock_date' })
      .limit(limit)
      .range(offset, offset + limit - 1);

    if (fetchError) {
      console.error('Fetch capsules error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch capsules' },
        { status: 500 }
      );
    }

    // Transform capsules: hide message if not unlocked
    const transformedCapsules = capsules.map((capsule) => {
      const now = new Date();
      const unlockDate = new Date(capsule.unlock_date);
      const isUnlocked = now >= unlockDate;

      return {
        ...capsule,
        isUnlocked,
        daysUntilUnlock: isUnlocked ? 0 : Math.ceil(
          (unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ),
        // Hide message if locked
        message: isUnlocked ? capsule.message : undefined,
      };
    });

    return NextResponse.json({
      capsules: transformedCapsules,
      limit,
      offset,
    });
  } catch (error) {
    console.error('GET /api/capsules error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## **Route 4: GET /api/capsules/[id]**

**Purpose**: Get single capsule (checks unlock status server-side).

**File**: `apps/future-capsule/src/app/api/capsules/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    // Authenticate user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch capsule (RLS ensures user owns it)
    const { data: capsule, error: fetchError } = await supabase
      .from('capsules')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', authUser.id)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !capsule) {
      return NextResponse.json(
        { error: 'Capsule not found' },
        { status: 404 }
      );
    }

    // Check if capsule is unlocked (server-side validation)
    const now = new Date();
    const unlockDate = new Date(capsule.unlock_date);
    const isUnlocked = now >= unlockDate;

    // Return locked or unlocked response
    if (!isUnlocked) {
      // Locked: hide message
      return NextResponse.json({
        id: capsule.id,
        title: capsule.title,
        mood: capsule.mood,
        unlockDate: capsule.unlock_date,
        photoURL: capsule.photo_url,
        createdAt: capsule.created_at,
        isUnlocked: false,
        daysUntilUnlock: Math.ceil(
          (unlockDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ),
      });
    }

    // Unlocked: return full capsule
    return NextResponse.json({
      ...capsule,
      isUnlocked: true,
    });
  } catch (error) {
    console.error(`GET /api/capsules/${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## **Route 5: PUT /api/capsules/[id]**

**Purpose**: Update capsule (only before unlock date).

**File**: `apps/future-capsule/src/app/api/capsules/[id]/route.ts`

```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    // Authenticate user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get capsule
    const { data: capsule, error: fetchError } = await supabase
      .from('capsules')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', authUser.id)
      .single();

    if (fetchError || !capsule) {
      return NextResponse.json(
        { error: 'Capsule not found' },
        { status: 404 }
      );
    }

    // Check if unlock date has passed
    if (new Date() >= new Date(capsule.unlock_date)) {
      return NextResponse.json(
        { error: 'Cannot update unlocked capsule' },
        { status: 403 }
      );
    }

    // Parse and validate updates
    const body = await request.json();
    const updates: Record<string, any> = {};

    if (body.title !== undefined) {
      if (body.title.length < 1 || body.title.length > 255) {
        return NextResponse.json(
          { error: 'Title must be 1-255 characters' },
          { status: 400 }
        );
      }
      updates.title = body.title;
    }

    if (body.message !== undefined) {
      if (body.message.length < 10 || body.message.length > 10000) {
        return NextResponse.json(
          { error: 'Message must be 10-10000 characters' },
          { status: 400 }
        );
      }
      updates.message = body.message;
    }

    if (body.mood !== undefined) {
      if (!['Happy', 'Motivated', 'Confused', 'Sad', 'Grateful', 'Hopeful'].includes(body.mood)) {
        return NextResponse.json(
          { error: 'Invalid mood' },
          { status: 400 }
        );
      }
      updates.mood = body.mood;
    }

    // Update capsule
    const { data: updated, error: updateError } = await supabase
      .from('capsules')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', authUser.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update capsule error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update capsule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ capsule: updated });
  } catch (error) {
    console.error(`PUT /api/capsules/${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## **Route 6: DELETE /api/capsules/[id]**

**Purpose**: Delete capsule.

**File**: `apps/future-capsule/src/app/api/capsules/[id]/route.ts`

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    // Authenticate user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Soft delete: mark is_deleted = true
    const { error: deleteError } = await supabase
      .from('capsules')
      .update({ is_deleted: true })
      .eq('id', params.id)
      .eq('user_id', authUser.id);

    if (deleteError) {
      console.error('Delete capsule error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete capsule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Capsule deleted' }, { status: 204 });
  } catch (error) {
    console.error(`DELETE /api/capsules/${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## **Route 7: POST /api/auth/signup**

**Purpose**: Register new user with email/password.

**File**: `apps/future-capsule/src/app/api/auth/signup/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface SignupRequest {
  email: string;
  password: string;
  displayName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const body: SignupRequest = await request.json();

    // Validate input
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    if (body.password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Sign up user
    const { data, error: signupError } = await supabase.auth.signUpWithPassword({
      email: body.email,
      password: body.password,
      options: {
        data: {
          display_name: body.displayName || body.email,
        },
      },
    });

    if (signupError) {
      console.error('Signup error:', signupError);
      return NextResponse.json(
        { error: signupError.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { user: data.user, session: data.session },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/auth/signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## **Error Response Format**

All endpoints follow consistent error responses:

```json
{
  "error": "Human-readable error message",
  "code": "error_code (optional)"
}
```

**Common error codes**:
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (authenticated but denied)
- `404`: Not found
- `400`: Bad request (validation error)
- `500`: Internal server error

---

## **Request/Response Examples**

### Create Capsule

**Request**:
```bash
curl -X POST http://localhost:3000/api/capsules \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Letter to Future Me",
    "message": "Don'\''t give up on your dreams...",
    "mood": "Hopeful",
    "unlockDate": 1768046400000,
    "photoURL": null
  }'
```

**Response (201)**:
```json
{
  "capsule": {
    "id": "uuid",
    "user_id": "user-uuid",
    "title": "Letter to Future Me",
    "message": "Don't give up...",
    "mood": "Hopeful",
    "unlock_date": "2026-03-12T00:00:00Z",
    "photo_url": null,
    "status": "scheduled",
    "is_deleted": false,
    "created_at": "2024-03-12T10:00:00Z",
    "updated_at": "2024-03-12T10:00:00Z"
  }
}
```

### Get Locked Capsule

**Request**:
```bash
curl http://localhost:3000/api/capsules/uuid
```

**Response (200)** - Locked (unlock_date in future):
```json
{
  "id": "uuid",
  "title": "Letter to Future Me",
  "mood": "Hopeful",
  "unlockDate": "2026-03-12T00:00:00Z",
  "photoURL": null,
  "createdAt": "2024-03-12T10:00:00Z",
  "isUnlocked": false,
  "daysUntilUnlock": 45
}
```

### List Capsules

**Request**:
```bash
curl 'http://localhost:3000/api/capsules?limit=10&offset=0&sortBy=created_at'
```

**Response (200)**:
```json
{
  "capsules": [
    {
      "id": "uuid",
      "title": "...",
      "mood": "Happy",
      "isUnlocked": true,
      "daysUntilUnlock": 0,
      "message": "This capsule is unlocked!",
      "... other fields"
    }
  ],
  "limit": 10,
  "offset": 0
}
```

---

## **Testing Endpoints**

Use Postman, Insomnia, or curl:

```bash
# Set auth token
TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -d '{"email":"test@example.com","password":"password"}' | jq '.session.access_token')

# List capsules
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/capsules
```

---

## **Type Definitions**

See [libs/supabase-config](SUPABASE_CONFIG_LIBRARY.md) for TypeScript definitions.

---

## **References**

- **Next.js API Routes**: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
- **Supabase Auth Helpers**: https://supabase.com/docs/guides/auth/auth-helpers/nextjs
- **Error Handling**: https://nextjs.org/docs/app/building-your-application/routing/error-handling
