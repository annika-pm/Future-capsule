# Supabase Setup Guide - FutureCapsule Migration

Complete step-by-step guide to set up Supabase for the FutureCapsule project.

---

## **Phase 1: Supabase Account & Project Creation**

### Step 1: Create Supabase Account

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click **"Sign Up"**
3. Choose **"Sign up with GitHub"** or email
4. Verify your email or GitHub authentication

### Step 2: Create New Project

1. Click **"New Project"** in the Supabase dashboard
2. Enter project details:
   - **Project Name**: `future-capsule` (or your preference)
   - **Database Password**: Generate a strong password (save this securely in a password manager)
   - **Region**: Choose closest to your users (e.g., `us-east-1` for US, `eu-west-1` for EU)
   - **Organization**: Select your organization

3. Click **"Create new project"**
4. Wait for database initialization (~2-5 minutes)

### Step 3: Retrieve Project Credentials

Once the project is created:

1. Go to **Settings** → **API** (left sidebar)
2. Copy and save the following:
   - **Project URL**: `https://[project-id].supabase.co`
   - **Anon Key** (public): Used for frontend, safe to expose
   - **Service Role Key** (private): Used for backend API routes, **never expose publicly**
   - **JWT Secret**: Used for custom claims

3. Create a `.env.local` file locally with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
   SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
   SUPABASE_JWT_SECRET=[your-jwt-secret]
   ```

---

## **Phase 2: Database Schema Setup**

### Step 1: Access SQL Editor

1. In the Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Name the query (e.g., `01_create_users_table`)

### Step 2: Execute Migration Files

Copy and run the SQL migrations in this order:

**Migration 1: Create users table**
```sql
-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  display_name text,
  photo_url text,
  timezone text,
  email_notifications boolean DEFAULT true,
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
GRANT SELECT, UPDATE ON table public.users TO authenticated;
```

**Migration 2: Create capsules table**
```sql
CREATE TABLE public.capsules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  mood text NOT NULL CHECK (mood IN ('Happy', 'Motivated', 'Confused', 'Sad', 'Grateful', 'Hopeful')),
  unlock_date timestamp with time zone NOT NULL,
  photo_url text,
  status text DEFAULT 'scheduled' CHECK (status IN ('draft', 'scheduled', 'unlocked', 'archived')),
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create indexes for performance
CREATE INDEX idx_capsules_user_id ON public.capsules(user_id);
CREATE INDEX idx_capsules_unlock_date ON public.capsules(unlock_date);
CREATE INDEX idx_capsules_user_unlock ON public.capsules(user_id, unlock_date);
CREATE INDEX idx_capsules_created_at ON public.capsules(created_at DESC);

-- Enable RLS
ALTER TABLE public.capsules ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON table public.capsules TO authenticated;
```

**Migration 3: Create mood_stats table (optional, for insights)**
```sql
CREATE TABLE public.mood_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mood text NOT NULL CHECK (mood IN ('Happy', 'Motivated', 'Confused', 'Sad', 'Grateful', 'Hopeful')),
  count integer DEFAULT 1,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, mood, date)
);

-- Create index for performance
CREATE INDEX idx_mood_stats_user_date ON public.mood_stats(user_id, date DESC);

-- Enable RLS
ALTER TABLE public.mood_stats ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON table public.mood_stats TO authenticated;
```

---

## **Phase 3: Row-Level Security (RLS) Policies**

### Step 1: Users Table RLS

In SQL Editor, create new query for users RLS:

```sql
-- Users: Only users can see their own profile
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Users: Only users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users: Profile created automatically via trigger (backend responsibility)
CREATE POLICY "Users can insert own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### Step 2: Capsules Table RLS

In SQL Editor, create new query for capsules RLS:

```sql
-- Capsules: Users can insert their own capsules
CREATE POLICY "Users can insert own capsules"
  ON public.capsules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Capsules: Users can view their own capsules (locked or unlocked)
CREATE POLICY "Users can view own capsules"
  ON public.capsules
  FOR SELECT
  USING (auth.uid() = user_id);

-- Capsules: Users can update their own capsules before unlock date
CREATE POLICY "Users can update unlocked capsules"
  ON public.capsules
  FOR UPDATE
  USING (auth.uid() = user_id AND unlock_date > now())
  WITH CHECK (auth.uid() = user_id);

-- Capsules: Users can delete their own capsules
CREATE POLICY "Users can delete own capsules"
  ON public.capsules
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Step 3: Mood Stats RLS

```sql
-- Mood Stats: Users can view their own stats
CREATE POLICY "Users can view own mood stats"
  ON public.mood_stats
  FOR SELECT
  USING (auth.uid() = user_id);

-- Mood Stats: Users can insert their own stats
CREATE POLICY "Users can insert own mood stats"
  ON public.mood_stats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Mood Stats: Users can update their own stats
CREATE POLICY "Users can update own mood stats"
  ON public.mood_stats
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## **Phase 4: Authentication Setup**

### Step 4.1: Enable Email/Password Authentication

1. Go to **Authentication** → **Providers** (left sidebar)
2. Find **Email** provider
3. Click **"Email"** to enable it
4. Configure:
   - **Confirm email**: Enable if you want email verification
   - **Email templates**: Customize welcome/confirmation emails (optional)

### Step 4.2: Enable Google OAuth

1. Go to **Authentication** → **Providers**
2. Click **"Google"**
3. Click **"Enable Google"**
4. You'll be prompted for:
   - **Google Client ID**
   - **Google Client Secret**

#### Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (if needed):
   - Click project dropdown → "New Project"
   - Enter project name (e.g., `future-capsule-oauth`)
3. Enable Google Sign-In API:
   - Go to **APIs & Services** → **Library**
   - Search **"Google+ API"** (or **"People API"**)
   - Click and **Enable API**
4. Create OAuth 2.0 Credentials:
   - Go to **APIs & Services** → **Credentials**
   - Click **"Create Credentials"** → **OAuth 2.0 Client ID**
   - Choose **"Web application"**
   - Under **Authorized redirect URIs**, add:
     ```
     https://[your-project-id].supabase.co/auth/v1/callback
     https://localhost:3000 (for local development)
     ```
   - Click Create
   - Copy **Client ID** and **Client Secret**

5. Back in Supabase **Authentication** → **Providers** → **Google**:
   - Paste **Google Client ID**
   - Paste **Google Client Secret**
   - Click **"Save"**

### Step 4.3: Configure Session Settings

1. Go to **Authentication** → **URL Configuration** (in settings)
2. Set **Site URL**: `https://your-vercel-domain.com`
3. Add **Redirect URLs** for login/signup:
   ```
   https://your-vercel-domain.com/dashboard
   https://your-vercel-domain.com/login
   https://localhost:3000/dashboard (dev)
   ```

---

## **Phase 5: Storage Setup**

### Step 1: Create Storage Bucket

1. Go to **Storage** (left sidebar)
2. Click **"Create a new bucket"**
3. Name it: `capsule-photos`
4. Choose **Public** or **Private**:
   - **Public**: Photos are accessible via URL (simpler, good for avatars)
   - **Private**: Photos require authentication (more secure)
   - Recommendation: Use **Private** and serve via API

### Step 2: Configure Storage Policies

In **Storage** → **capsule-photos** → **Policies**:

```sql
-- Allow users to upload their own photos
CREATE POLICY "Users can upload own photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'capsule-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to read their own photos
CREATE POLICY "Users can read own photos"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'capsule-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own photos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'capsule-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### Step 3: Configure Bucket Limits

1. Go to **Storage** → **Settings**
2. Set:
   - **Max file size**: 5 MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`

---

## **Phase 6: Environment Variables in Vercel**

### Step 1: Add to Vercel Dashboard

1. Go to Vercel dashboard → Your project → **Settings** → **Environment Variables**
2. Add the following (from Step 1.3):
   ```
   NEXT_PUBLIC_SUPABASE_URL = https://[project-id].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = [your-anon-key]
   SUPABASE_SERVICE_ROLE_KEY = [your-service-role-key]
   SUPABASE_JWT_SECRET = [your-jwt-secret]
   ```

3. Set environment for:
   - **Production**
   - **Preview** (optional)
   - **Development** (optional)

---

## **Phase 7: Verify Setup**

### Test Database Connection

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login and test:
   ```bash
   supabase login
   supabase projects list
   ```

### Test Authentication

1. Go to Supabase **Authentication** → **Users**
2. Click **"Create a new user"**
3. Enter email and password
4. Send invite or set password manually

### Test Storage

1. Go to **Storage** → **capsule-photos**
2. Upload a test image
3. Verify file appears in bucket

---

## **Next Steps**

After completing this setup:

1. ✅ Install Supabase client libraries (see [libs/supabase-config setup](SUPABASE_CONFIG_LIBRARY.md))
2. ✅ Create Next.js API routes (see [API ROUTES DOCUMENTATION](SUPABASE_API_ROUTES.md))
3. ✅ Update frontend to use Supabase client
4. ✅ Migrate existing Firebase data (optional, see [MIGRATION_GUIDE.md](FIREBASE_TO_SUPABASE_MIGRATION.md))
5. ✅ Deploy to Vercel with Supabase environment variables

---

## **Troubleshooting**

### Issue: "Unauthorized" errors
- Check RLS policies are correctly configured
- Verify JWT token is being sent in API requests
- Ensure user is authenticated before API calls

### Issue: Storage upload fails
- Verify bucket policies allow authenticated uploads
- Check file size doesn't exceed 5MB limit
- Verify file MIME type is allowed (jpeg, png, webp)

### Issue: Google OAuth not working
- Verify Client ID/Secret are correct in Supabase
- Ensure redirect URI matches Supabase configuration
- Check Google Cloud Console project is active

### Issue: RLS policies blocking legitimate requests
- Review RLS policies in **Authentication** → **Policies** tab
- Add `EXPLAIN PLAN` to analyze SQL policies
- Temporarily disable RLS to test (security risk, dev only)

---

## **Reference**

- **Supabase Dashboard**: https://app.supabase.com
- **Supabase Documentation**: https://supabase.com/docs
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **Row-Level Security Guide**: https://supabase.com/docs/guides/auth/row-level-security
