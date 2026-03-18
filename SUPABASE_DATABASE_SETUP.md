# Supabase Database Setup & RLS Policies

Complete SQL setup for FutureCapsule Supabase backend.

## 📊 Database Schema

Run these SQL commands in Supabase SQL Editor:

### 1. Capsules Table

```sql
-- Create capsules table
-- User ID is a foreign key to Supabase's auth.users table
CREATE TABLE IF NOT EXISTS capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  mood VARCHAR(50) NOT NULL,
  unlock_date TIMESTAMP WITH TIME ZONE NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_capsules_user_id ON capsules(user_id);
CREATE INDEX IF NOT EXISTS idx_capsules_unlock_date ON capsules(unlock_date);
CREATE INDEX IF NOT EXISTS idx_capsules_created_at ON capsules(created_at DESC);
```

### 2. Enable Row Level Security

```sql
-- Enable RLS on capsules table
-- This ensures data isolation at the database level
ALTER TABLE capsules ENABLE ROW LEVEL SECURITY;
```

## 🔐 Row Level Security (RLS) Policies

### Policy 1: Users can read their own capsules

```sql
CREATE POLICY "Users can read own capsules"
ON capsules
FOR SELECT
USING (auth.uid() = user_id);
```

**What it does:**
- Users can only see capsules where `user_id` matches their authenticated ID
- `auth.uid()` returns the currently authenticated user's ID
- Perfect for listing capsules in the dashboard

### Policy 2: Users can create capsules for themselves

```sql
CREATE POLICY "Users can create capsules"
ON capsules
FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**What it does:**
- Users can only insert capsules where `user_id` is their own
- Prevents users from creating capsules for other users
- `WITH CHECK` validates the condition both on INSERT and UPDATE

### Policy 3: Users can update their own capsules

```sql
CREATE POLICY "Users can update own capsules"
ON capsules
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**What it does:**
- `USING`: Can only update capsules they own
- `WITH CHECK`: Can only update to themselves (can't change user_id)
- Ensures users can only edit their own capsules

### Policy 4: Users can delete their own capsules

```sql
CREATE POLICY "Users can delete own capsules"
ON capsules
FOR DELETE
USING (auth.uid() = user_id);
```

**What it does:**
- Users can only delete capsules they own
- Permanent deletion from the database

## 🔄 Triggers for Auto-updated_at

```sql
-- Create a function to auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on capsules table
CREATE TRIGGER capsules_updated_at_trigger
BEFORE UPDATE ON capsules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

**What it does:**
- Automatically updates `updated_at` whenever a capsule is modified
- No need for manual timestamp updates in API code

## ✅ Verification Checklist

After setting up the schema and RLS:

```sql
-- View all tables
\dt

-- View RLS status
SELECT * FROM pg_tables WHERE tablename = 'capsules';
-- rls should be TRUE

-- View all policies
SELECT * FROM pg_policies WHERE tablename = 'capsules';

-- View indexes
SELECT * FROM pg_indexes WHERE tablename = 'capsules';
```

## 🧪 Testing RLS Policies

### Test 1: User can't see other user's capsules

```sql
-- As User A, create a capsule
-- As User B, try to query capsules
-- Should return empty result (RLS blocks it)
SELECT * FROM capsules WHERE user_id != auth.uid();
-- Result: 0 rows (RLS denied)
```

### Test 2: User can't insert capsule for someone else

```sql
-- Try to create capsule with different user_id
INSERT INTO capsules (user_id, title, message, mood, unlock_date)
VALUES (
  'different-user-id',
  'Title',
  'Message',
  'Happy',
  NOW() + INTERVAL '1 month'
);
-- Result: Error (RLS violation)
```

### Test 3: User can update only their capsules

```sql
-- Create capsule as User A
INSERT INTO capsules (user_id, title, message, mood, unlock_date)
VALUES (auth.uid(), 'Title', 'Message', 'Happy', NOW() + INTERVAL '1 month');

-- Update as User A (should work)
UPDATE capsules SET title = 'New Title' WHERE user_id = auth.uid();
-- Result: Success

-- Update as User B (should fail)
-- Impossible to test directly, but RLS will block it
```

## 📱 API Integration

### Frontend sends to `/api/capsules`

```typescript
// Create a capsule
const response = await fetch('/api/capsules', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${user.id}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'My Capsule',
    message: 'Hello future me!',
    mood: 'Happy',
    unlock_date: '2025-12-31T00:00:00Z',
  }),
});
```

### API uses Service Role Admin Client

```typescript
// In /api/capsules/route.ts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Admin client
);

// Service Role bypasses RLS
const { data } = await supabase
  .from('capsules')
  .insert([capsuleData]);
// RLS is NOT applied for Service Role

// But API manually verifies user_id from JWT token
```

## ⚠️ Important Security Notes

1. **Service Role Key Bypasses RLS**
   - API uses Service Role for full access
   - API MUST verify user_id from JWT token
   - This is already done in the auth middleware

2. **RLS is Second Layer of Defense**
   - First layer: JWT verification in API
   - Second layer: RLS policies in database
   - Both must work correctly

3. **Never expose Service Role Key**
   - Only in API routes (server-side)
   - Never in frontend code
   - Store in Vercel environment variables

4. **Anon Key is Public**
   - Used by frontend client
   - Can't access restricted data due to RLS
   - Safe to commit to git

## 🚀 Testing Complete Flow

```bash
# 1. Start development server
npm run dev

# 2. Sign up at http://localhost:3000/signup
# Email: test@example.com
# Password: SecurePassword123!

# 3. Create a capsule
# Title: "First Test"
# Message: "Hello future me!"
# Mood: "Happy"
# Unlock Date: 2025-12-31

# 4. Verify in Supabase console
# - Check Table Editor → capsules
# - Should see capsule with your user_id

# 5. Test RLS in Supabase SQL
SELECT * FROM capsules;
-- Should see only YOUR capsules
```

## 🔧 Monitoring & Maintenance

### Check database health

```sql
-- View table size
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- View active connections
SELECT * FROM pg_stat_activity;

-- View slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

### Backup strategy

- Supabase automatically backs up every hour
- Keep automatic backups enabled in project settings
- Test restore process regularly

