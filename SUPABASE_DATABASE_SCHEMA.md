# PostgreSQL Database Schema - Supabase

Complete SQL migration scripts for FutureCapsule PostgreSQL schema. Run these in order in Supabase SQL Editor.

---

## **Migration 001: Create users table**

**Purpose**: Extend Supabase auth.users with custom user profile data.

```sql
-- Create public.users table
-- This table extends Supabase's built-in auth.users table
-- Foreign key references auth.users(id) for automatic cleanup
CREATE TABLE public.users (
  -- Primary key: links to Supabase auth.users(id)
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User email (denormalized from auth.users for easier access)
  email text NOT NULL UNIQUE,
  
  -- User's chosen display name
  display_name text,
  
  -- Optional profile photo URL from Cloud Storage
  photo_url text,
  
  -- User's timezone for countdown calculations
  -- Format: "America/New_York", "Europe/London", etc.
  timezone text,
  
  -- User preferences
  email_notifications boolean DEFAULT true,
  
  -- Account status
  status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON public.users(email);

-- Create index on status for filtering
CREATE INDEX idx_users_status ON public.users(status) WHERE status = 'active';

-- Enable Row-Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Ensure proper permissions
GRANT SELECT, UPDATE ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- Add comment for documentation
COMMENT ON TABLE public.users IS 'User profiles linked to Supabase auth.users';
COMMENT ON COLUMN public.users.id IS 'Foreign key to auth.users(id)';
COMMENT ON COLUMN public.users.email IS 'User email, must be unique';
COMMENT ON COLUMN public.users.display_name IS 'User-chosen display name';
COMMENT ON COLUMN public.users.timezone IS 'User timezone for countdown calculations';
COMMENT ON COLUMN public.users.email_notifications IS 'Whether user receives unlock notifications';
```

---

## **Migration 002: Create capsules table**

**Purpose**: Store user-created time capsules with unlock scheduling.

```sql
-- Create public.capsules table
-- Stores all user capsules with mood, message, and unlock date
CREATE TABLE public.capsules (
  -- Primary key: UUID generated on client or server
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign key: which user owns this capsule
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Capsule title (visible when locked and unlocked)
  title text NOT NULL,
  
  -- Full letter/message content (only visible when unlocked)
  message text NOT NULL,
  
  -- Emotional state when capsule was created
  mood text NOT NULL CHECK (mood IN (
    'Happy', 'Motivated', 'Confused', 'Sad', 'Grateful', 'Hopeful'
  )),
  
  -- Date/time when capsule becomes readable
  unlock_date timestamp with time zone NOT NULL,
  
  -- Optional: URL to attached photo in Cloud Storage
  -- Format: https://{project-id}.supabase.co/storage/v1/object/public/capsule-photos/{user_id}/{capsule_id}/{filename}
  photo_url text,
  
  -- Capsule status for workflow management
  status text DEFAULT 'scheduled' CHECK (status IN (
    'draft',      -- Not yet finalized
    'scheduled',  -- Scheduled for future unlock
    'unlocked',   -- Unlock date has passed
    'archived'    -- User archived this capsule
  )),
  
  -- Soft delete flag (for data preservation)
  is_deleted boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create indexes for performance
-- Most common queries: by user_id and unlock_date

-- Index for user's capsules
CREATE INDEX idx_capsules_user_id 
  ON public.capsules(user_id) 
  WHERE is_deleted = false;

-- Index for future unlocks
CREATE INDEX idx_capsules_unlock_date 
  ON public.capsules(unlock_date) 
  WHERE is_deleted = false;

-- Composite index for common query: user's upcoming capsules
CREATE INDEX idx_capsules_user_unlock 
  ON public.capsules(user_id, unlock_date) 
  WHERE is_deleted = false;

-- Index for user's recent capsules
CREATE INDEX idx_capsules_created_at 
  ON public.capsules(created_at DESC) 
  WHERE user_id IS NOT NULL AND is_deleted = false;

-- Index for status queries
CREATE INDEX idx_capsules_status 
  ON public.capsules(user_id, status) 
  WHERE is_deleted = false;

-- Enable Row-Level Security
ALTER TABLE public.capsules ENABLE ROW LEVEL SECURITY;

-- Ensure proper permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.capsules TO authenticated;
GRANT SELECT ON public.capsules TO anon; -- Allow preview if needed

-- Add comments for documentation
COMMENT ON TABLE public.capsules IS 'User time capsules with scheduled unlock dates';
COMMENT ON COLUMN public.capsules.id IS 'Unique capsule identifier';
COMMENT ON COLUMN public.capsules.user_id IS 'Owner of the capsule';
COMMENT ON COLUMN public.capsules.unlock_date IS 'When the capsule becomes readable';
COMMENT ON COLUMN public.capsules.mood IS 'Emotional state when created';
COMMENT ON COLUMN public.capsules.status IS 'Workflow status: draft, scheduled, unlocked, archived';
COMMENT ON COLUMN public.capsules.is_deleted IS 'Soft delete flag for data preservation';
```

---

## **Migration 003: Create mood_stats table (Optional)**

**Purpose**: Track mood distribution for insights/dashboard features.

```sql
-- Create public.mood_stats table
-- Aggregated mood statistics for user insights and mood tracking
CREATE TABLE public.mood_stats (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User who created these stats
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Which mood this stat tracks
  mood text NOT NULL CHECK (mood IN (
    'Happy', 'Motivated', 'Confused', 'Sad', 'Grateful', 'Hopeful'
  )),
  
  -- Count of capsules with this mood on this date
  count integer DEFAULT 1,
  
  -- Date for statistical aggregation
  date date NOT NULL DEFAULT CURRENT_DATE,
  
  -- Timestamp when stat was recorded
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  -- Ensure one row per user/mood/date combination
  UNIQUE(user_id, mood, date)
);

-- Create index for efficient date range queries
CREATE INDEX idx_mood_stats_user_date 
  ON public.mood_stats(user_id, date DESC);

-- Create index for mood aggregations
CREATE INDEX idx_mood_stats_mood 
  ON public.mood_stats(mood, date DESC);

-- Enable Row-Level Security
ALTER TABLE public.mood_stats ENABLE ROW LEVEL SECURITY;

-- Ensure proper permissions
GRANT SELECT, INSERT, UPDATE ON public.mood_stats TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.mood_stats IS 'Aggregated mood statistics for user insights';
COMMENT ON COLUMN public.mood_stats.mood IS 'The mood category';
COMMENT ON COLUMN public.mood_stats.count IS 'Number of capsules with this mood on date';
COMMENT ON COLUMN public.mood_stats.date IS 'Date of statistical aggregation';
```

---

## **Migration 004: Create audit_log table (Optional)**

**Purpose**: Track all modifications to capsules for compliance and debugging.

```sql
-- Create public.audit_log table
-- Immutable log of all modifications for audit trail
CREATE TABLE public.audit_log (
  -- Primary key
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who performed the action
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- What table was modified
  table_name text NOT NULL,
  
  -- ID of modified record
  record_id uuid NOT NULL,
  
  -- What action: INSERT, UPDATE, DELETE
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  
  -- Old data (for UPDATE/DELETE)
  old_data jsonb,
  
  -- New data (for INSERT/UPDATE)
  new_data jsonb,
  
  -- When it happened
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create index for user queries
CREATE INDEX idx_audit_log_user 
  ON public.audit_log(user_id, created_at DESC);

-- Create index for record tracking
CREATE INDEX idx_audit_log_record 
  ON public.audit_log(table_name, record_id, created_at DESC);

-- Disable RLS for audit log (append-only for all authenticated users)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Grant access
GRANT INSERT, SELECT ON public.audit_log TO authenticated;

-- Add comment
COMMENT ON TABLE public.audit_log IS 'Immutable audit trail of all data modifications';
```

---

## **Migration 005: Create trigger for user profile creation**

**Purpose**: Automatically create user profile when user signs up via Supabase Auth.

```sql
-- Create function to handle new user signup
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

-- Create trigger to call function on new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Add comment
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically create user profile when auth.user is created';
```

---

## **Migration 006: Add location columns to capsules table**

**Purpose**: Store GPS coordinates extracted from photo EXIF data for map visualization.

```sql
-- Add latitude and longitude columns to capsules table
ALTER TABLE public.capsules
ADD COLUMN latitude numeric(10, 8),
ADD COLUMN longitude numeric(11, 8);

-- Add check constraints for valid GPS coordinates
ALTER TABLE public.capsules
ADD CONSTRAINT check_latitude 
  CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
ADD CONSTRAINT check_longitude 
  CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

-- Create index for location queries (for future map clustering features)
CREATE INDEX idx_capsules_location 
  ON public.capsules(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.capsules.latitude IS 'GPS latitude extracted from photo EXIF data (-90 to 90)';
COMMENT ON COLUMN public.capsules.longitude IS 'GPS longitude extracted from photo EXIF data (-180 to 180)';
```
```

---

## **Migration 006: Create trigger for updated_at timestamp**

**Purpose**: Automatically update the `updated_at` timestamp when records change.

```sql
-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Apply trigger to users table
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Apply trigger to capsules table
CREATE TRIGGER update_capsules_updated_at
BEFORE UPDATE ON public.capsules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Updates updated_at timestamp on record modification';
```

---

## **Migration 007: Create stored procedure for mood stats aggregation**

**Purpose**: Efficiently aggregate mood statistics from capsules.

```sql
-- Create procedure to sync mood stats from capsules
CREATE OR REPLACE FUNCTION public.sync_mood_stats_for_user(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete old stats for this user
  DELETE FROM public.mood_stats
  WHERE user_id = user_uuid
  AND date >= CURRENT_DATE - INTERVAL '30 days'; -- Keep 30 days of history

  -- Insert aggregated stats from capsules
  INSERT INTO public.mood_stats (user_id, mood, count, date)
  SELECT
    user_id,
    mood,
    COUNT(*) as count,
    DATE(created_at) as date
  FROM public.capsules
  WHERE user_id = user_uuid
  AND is_deleted = false
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY user_id, mood, DATE(created_at)
  ON CONFLICT (user_id, mood, date)
  DO UPDATE SET count = EXCLUDED.count;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.sync_mood_stats_for_user(uuid) IS 'Aggregates mood statistics from capsules for the past 30 days';
```

---

## **Migration 008: Create search index (Optional, for full-text search)**

**Purpose**: Enable efficient searching across capsule titles and messages.

```sql
-- Add GIN index for full-text search on capsule titles and messages
CREATE INDEX idx_capsules_search
ON public.capsules
USING GIN (to_tsvector('english', title || ' ' || message))
WHERE is_deleted = false;

-- Add comment
COMMENT ON INDEX idx_capsules_search IS 'Full-text search index for capsule discovery';
```

---

## **Migration Execution Order**

1. **001**: Users table (required)
2. **002**: Capsules table (required)
3. **003**: Mood stats (optional, for insights)
4. **004**: Audit log (optional, for compliance)
5. **005**: User profile creation trigger (required)
6. **006**: Updated_at timestamp trigger (required)
7. **007**: Mood stats aggregation procedure (optional)
8. **008**: Full-text search index (optional)

---

## **Verify Schema**

After running all migrations, verify schema:

```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- List all indexes
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- List all policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;

-- Count rows in each table
SELECT 'users' as table_name, COUNT(*) FROM public.users
UNION ALL
SELECT 'capsules', COUNT(*) FROM public.capsules
UNION ALL
SELECT 'mood_stats', COUNT(*) FROM public.mood_stats;
```

---

## **Backup & Restore**

### Backup your database

```bash
# Using Supabase CLI
supabase db pull --project-id your-project-id

# Or using psql
pg_dump -h db.xxxxxxxxxxxx.supabase.co \
  -U postgres \
  -d postgres \
  > backup.sql
```

### Restore from backup

```bash
# Using psql
psql -h db.xxxxxxxxxxxx.supabase.co \
  -U postgres \
  -d postgres \
  < backup.sql
```

---

## **Performance Tuning**

Monitor slow queries:

```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;

-- Monitor missing indexes
SELECT
  current_database(),
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats
WHERE schemaname = 'public'
AND n_distinct > 100
AND correlation < 0.1
ORDER BY abs(correlation) ASC;
```

---

## **References**

- **PostgreSQL Types**: https://www.postgresql.org/docs/current/datatype.html
- **Row-Level Security**: https://www.postgresql.org/docs/current/sql-createpolicy.html
- **Indexes**: https://www.postgresql.org/docs/current/indexes.html
- **Triggers**: https://www.postgresql.org/docs/current/sql-createtrigger.html
