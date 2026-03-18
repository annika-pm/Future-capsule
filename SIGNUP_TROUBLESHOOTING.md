# Signup Not Creating Users - Solution Guide

## Problem
Users can create an account, but it's not stored in the database.

## Root Causes

### 1. ❌ Missing Database Trigger (Primary Issue)
Supabase doesn't automatically create user profiles. You need a **trigger** that runs when `auth.users` is created.

**Fix**: See `SUPABASE_SETUP_SCRIPT.sql` - run all SQL commands in your Supabase SQL Editor.

### 2. ❌ Email Confirmation Required
Supabase has email confirmation **enabled by default**. Users must confirm their email before they can use their account.

**Current behavior**:
```
User signs up → Email sent → User not logged in → "Please check your email"
```

**Solutions**:

#### Option A: Disable Email Confirmation (Development Only)
1. Go to https://app.supabase.com → Your Project
2. Authentication → Providers → Email
3. Uncheck "Confirm email" 
4. Save

⚠️ **WARNING**: Only use in development! Enable for production.

#### Option B: Keep Email Confirmation (Recommended for Production)
1. Add email confirmation step to your signup flow
2. Users confirm via email link
3. Then they can log in

### 3. ⚠️ Google OAuth Bypass
Google OAuth **doesn't require email confirmation** - that's why it works while email signup doesn't.

## Step-by-Step Fix

### Step 1: Create Database Trigger
1. Open Supabase Dashboard → SQL Editor
2. Run the full `SUPABASE_SETUP_SCRIPT.sql` 
3. Verify: Go to `public.users` table - you should see it now

### Step 2: Disable Email Confirmation (Dev Only)
1. Go to **Authentication** → **Providers** → **Email**
2. Uncheck **Confirm email**
3. Save

### Step 3: Test Signup
1. Go to http://localhost:3000/signup
2. Create a test account
3. Check your Supabase dashboard:
   - **Authentication** → **Users** - should see your user
   - **public.users** table - should see the profile entry
4. You should be automatically logged in

## Verification Checklist

- [ ] Trigger `on_auth_user_created` exists in Supabase SQL Editor
- [ ] `public.users` table exists with proper columns
- [ ] Email confirmation is disabled (for development)
- [ ] Can sign up with email/password
- [ ] User appears in `auth.users` 
- [ ] User profile appears in `public.users`
- [ ] Automatically logged in after signup

## If Still Not Working

Run this query in your Supabase SQL Editor to debug:

```sql
-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';

-- Check if function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'handle_new_user';

-- Check users table
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users';
```

All three should return results. If not, re-run `SUPABASE_SETUP_SCRIPT.sql`.
