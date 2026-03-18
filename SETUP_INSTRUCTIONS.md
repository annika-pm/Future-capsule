# Quick Setup Guide - Fix User Profile Foreign Key Error

## Problem
User signup works, but user profiles aren't being created in the database. This causes the foreign key error when trying to create capsules.

## Solution: 2 Options

### ✅ Option 1: Run SQL Setup (Recommended - 5 minutes)

**Step 1: Open Supabase SQL Editor**
1. Go to https://app.supabase.com
2. Select **your project**
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

**Step 2: Run the Setup Script**
1. Open the file: `SUPABASE_SETUP_SCRIPT.sql` in this workspace
2. Copy **all the SQL code**
3. Paste into the Supabase SQL Editor query box
4. Click **Execute**

**Step 3: Verify**
- No errors should appear
- Status shows "1 Query executed"

**Step 4: Test**
- Go back to http://localhost:3000
- Try creating a capsule again
- Should work now! ✅

---

### ⚠️ Option 2: Manually Fix Existing User (Quick Fix)

If you just want to fix the existing user quickly:

**Step 1: Get User ID from Error**
- From the error above: `userid: 'dad845f3-67c9-4b69-a6cf-b52b5bdeae76'`

**Step 2: Run This SQL in Supabase**
```sql
-- Manually create profile for existing user
INSERT INTO public.users (id, email, display_name, created_at, updated_at)
VALUES (
  'dad845f3-67c9-4b69-a6cf-b52b5bdeae76',
  'user-email@example.com',
  'User Display Name',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
```

⚠️ Replace:
- `'dad845f3-67c9-4b69-a6cf-b52b5bdeae76'` with your actual user ID
- `'user-email@example.com'` with their email
- `'User Display Name'` with their name

---

## Recommended: Do Option 1

Option 1 sets up the **automatic trigger** so:
- All future signups automatically create user profiles
- No more manual intervention needed
- This is the proper solution

---

## After Running SQL

**Logout, then:**
1. Go to `/signup` 
2. Create a new test account
3. Go to `/create`
4. Create a capsule
5. Should work! ✅

---

## Still Getting Error?

If still failing after running the SQL:

**Check if trigger was created:**

Go to Supabase → SQL Editor → New Query:
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

Should see: `on_auth_user_created | users`

If not visible, re-run `SUPABASE_SETUP_SCRIPT.sql`

---

## Need Help?

Run this in Supabase SQL Editor to see what's missing:

```sql
-- Check 1: Does users table exist?
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_name = 'users'
) as users_table_exists;

-- Check 2: Does user profile exist for your ID?
SELECT id, email FROM public.users 
WHERE id = 'dad845f3-67c9-4b69-a6cf-b52b5bdeae76';

-- Check 3: Does auth user exist?
SELECT id, email FROM auth.users 
WHERE id = 'dad845f3-67c9-4b69-a6cf-b52b5bdeae76';

-- Check 4: Does trigger exist?
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public' AND trigger_name = 'on_auth_user_created';
```

All 4 should return positive results.
