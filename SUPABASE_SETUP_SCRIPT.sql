-- ============================================================================
-- SUPABASE DATABASE SETUP - User Profile Creation Trigger
-- ============================================================================
-- 
-- Run these SQL commands in your Supabase Dashboard:
-- 1. Go to https://app.supabase.com → Your Project
-- 2. SQL Editor → New Query
-- 3. Paste each section below and execute
--
-- ============================================================================
-- STEP 1: Create the users table (if it doesn't exist)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  photo_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Add comment
COMMENT ON TABLE public.users IS 'User profiles linked to Supabase auth.users';

-- ============================================================================
-- STEP 2: Enable RLS on users table
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Create RLS policies for users table
-- ============================================================================

-- Allow users to read their own profile
CREATE POLICY "users_can_view_own_profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "users_can_update_own_profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- STEP 4: Create function to handle new user signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically create user profile when new auth user is created';

-- ============================================================================
-- STEP 5: Create trigger to call function on auth signup
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 6: Create trigger for auto-updating updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check users table exists and has correct structure
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public';

-- Check trigger exists
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_schema = 'public';

-- ============================================================================
-- TEST: Create a test user to verify it works
-- ============================================================================
-- NOTE: Do NOT run this in production - just for testing!
-- 
-- After running the above, try signing up in your app.
-- Then check if the user appears in this query:
-- 
-- SELECT id, email, display_name, created_at FROM public.users;
--
-- If you see your new user, everything is working!
-- ============================================================================
