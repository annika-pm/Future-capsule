# Row-Level Security (RLS) Policies - Supabase

Production-ready RLS policies for FutureCapsule. Execute in Supabase SQL Editor in order.

---

## **Overview**

RLS policies enforce data access rules at the database layer:
- Users can only access their own data
- Prevents SQL injection attacks
- Transparent to application logic
- Performance-optimized with indexes

**Key Principle**: Every query is automatically filtered by `auth.uid() = user_id` or similar.

---

## **Policy Set 1: Users Table**

### Policy 1.1: Users can view their own profile

```sql
CREATE POLICY "users_can_view_own_profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);
```

**Logic**: User can only SELECT their own user row.

**Use Case**: User dashboard, profile page.

---

### Policy 1.2: Users can update their own profile

```sql
CREATE POLICY "users_can_update_own_profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

**Logic**:
- `USING`: Can only update their own row
- `WITH CHECK`: Can only update to maintain user_id = auth.uid()

**Use Case**: Update display name, timezone, notification preferences.

---

### Policy 1.3: System can create user profiles

```sql
CREATE POLICY "system_can_create_profiles"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

**Logic**: Only INSERT allowed when `id` matches authenticated user.

**Use Case**: Triggered on Supabase signup via `handle_new_user()` trigger.

---

### Policy 1.4: Users cannot delete their profiles (optional, enforce via app)

```sql
-- No DELETE policy = no deletion allowed at database level
-- Profile deletion handled via administrative tools or app-level soft delete
```

---

## **Enable RLS on Users Table**

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';
```

---

## **Policy Set 2: Capsules Table**

### Policy 2.1: Users can insert their own capsules

```sql
CREATE POLICY "capsules_can_insert_own"
  ON public.capsules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Logic**: Only allow INSERT if `user_id` matches authenticated user.

**Use Case**: User creates new capsule.

**Security**: Prevents users from creating capsules for other users.

---

### Policy 2.2: Users can view their own capsules (locked or unlocked)

```sql
CREATE POLICY "capsules_can_view_own"
  ON public.capsules
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Logic**: User can only SELECT capsules where `user_id = auth.uid()`.

**Use Case**: View locked capsules (with countdown), view unlocked capsules (with full message).

**Note**: Backend API **must still check** `unlock_date > now()` for locked capsules.

---

### Policy 2.3: Users can update their own capsules (before unlock)

```sql
CREATE POLICY "capsules_can_update_before_unlock"
  ON public.capsules
  FOR UPDATE
  USING (auth.uid() = user_id AND unlock_date > now())
  WITH CHECK (auth.uid() = user_id);
```

**Logic**:
- `USING`: Can only UPDATE if your capsule AND unlock date is in future
- `WITH CHECK`: After update, must still be your capsule

**Use Case**: Edit draft/scheduled capsule before unlock date.

**Security**: Cannot update unlocked capsules (immutable after unlock).

---

### Policy 2.4: Users can delete their own capsules

```sql
CREATE POLICY "capsules_can_delete_own"
  ON public.capsules
  FOR DELETE
  USING (auth.uid() = user_id);
```

**Logic**: User can only DELETE their own capsules.

**Use Case**: Remove capsule (soft delete via `is_deleted` flag recommended).

**Security**: Can delete at any time.

---

## **Enable RLS on Capsules Table**

```sql
ALTER TABLE public.capsules ENABLE ROW LEVEL SECURITY;

-- Verify
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'capsules';
```

---

## **Policy Set 3: Mood Stats Table**

### Policy 3.1: Users can view their own mood stats

```sql
CREATE POLICY "mood_stats_can_view_own"
  ON public.mood_stats
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Use Case**: User insights dashboard.

---

### Policy 3.2: Users can insert their own mood stats

```sql
CREATE POLICY "mood_stats_can_insert_own"
  ON public.mood_stats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Use Case**: Backend sync mood stats when capsule is created.

---

### Policy 3.3: Users can update their own mood stats

```sql
CREATE POLICY "mood_stats_can_update_own"
  ON public.mood_stats
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Use Case**: Recalculate mood stats (daily or on-demand).

---

## **Enable RLS on Mood Stats Table**

```sql
ALTER TABLE public.mood_stats ENABLE ROW LEVEL SECURITY;
```

---

## **Policy Set 4: Audit Log Table (Optional)**

### Policy 4.1: Users can view their own audit logs

```sql
CREATE POLICY "audit_log_can_view_own"
  ON public.audit_log
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Use Case**: Show user what changes they made to their data.

---

### Policy 4.2: Only system can insert audit logs

```sql
CREATE POLICY "audit_log_insert_system_only"
  ON public.audit_log
  FOR INSERT
  WITH CHECK (false);  -- No direct INSERT from client

-- Instead: Use server-side procedure or trigger to insert audit logs
```

**Use Case**: Prevent user from tampering with audit logs.

---

## **Enable RLS on Audit Log Table**

```sql
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
```

---

## **Verify all RLS Policies**

```sql
-- List all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

---

## **Testing RLS Policies (Development Only)**

### Test 1: User can only see their own profile

```sql
-- Switch to user context (simulated)
-- In real app: Supabase client handles this via JWT token

-- Query should work (user's own profile)
SELECT * FROM public.users 
WHERE id = 'user-uuid-1'::uuid;

-- Query would fail if trying another user:
SELECT * FROM public.users 
WHERE id = 'user-uuid-2'::uuid;
-- Result: 0 rows (RLS blocks access)
```

### Test 2: User cannot see other users' capsules

```sql
-- As user-uuid-1, view their own capsules
SELECT id, title, unlock_date FROM public.capsules
WHERE user_id = 'user-uuid-1'::uuid;
-- Result: Returns user's capsules

-- As user-uuid-1, try to view user-uuid-2's capsules
SELECT id, title, unlock_date FROM public.capsules
WHERE user_id = 'user-uuid-2'::uuid;
-- Result: 0 rows (RLS blocks)
```

### Test 3: Cannot update other users' capsules

```sql
-- Attempt UPDATE on another user's capsule fails silently
UPDATE public.capsules
SET title = 'Hacked'
WHERE user_id = 'user-uuid-2'::uuid;
-- Result: 0 rows updated (RLS blocks)
```

---

## **Bypass RLS for Server-Side Operations**

Sometimes backend needs to bypass RLS (e.g., admin operations, aggregations).

### Method 1: Use Service Role Key

```typescript
// In Next.js API route (server-side only)
import { createClient } from "@supabase/supabase-js";

// Create client with SERVICE ROLE KEY (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Has RLS bypass
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// This query bypasses RLS
const { data: allCapsules } = await supabaseAdmin
  .from("capsules")
  .select("*"); // Can access any capsule
```

### Method 2: Use Anon Key (Respects RLS)

```typescript
// Frontend or client-side operations
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Respects RLS
);

// This query respects RLS
const { data: userCapsules } = await supabaseClient
  .from("capsules")
  .select("*"); // Only returns authenticated user's capsules
```

---

## **Common RLS Issues & Troubleshooting**

### Issue 1: "new row violates row-level security policy"

**Cause**: Trying to INSERT with mismatched `user_id`.

**Fix**:
```typescript
// ❌ Wrong: Hardcoded user_id
const { data, error } = await supabase
  .from("capsules")
  .insert({ user_id: "someone-else-id", title: "..." });

// ✅ Correct: Use authenticated user's ID
const { data: { user } } = await supabase.auth.getUser();
const { data, error } = await supabase
  .from("capsules")
  .insert({ user_id: user.id, title: "..." });
```

### Issue 2: Queries return empty results

**Cause**: RLS policy is too restrictive or user not authenticated.

**Fix**:
```typescript
// Verify user is authenticated
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  console.error("User not authenticated");
  return;
}

// Verify auth.uid() matches user.id
console.log("auth.uid():", user.id);
```

### Issue 3: Admin operations blocked by RLS

**Cause**: Using anon key instead of service role key.

**Fix**: Use `supabaseAdmin` client created with SERVICE_ROLE_KEY.

---

## **Performance Considerations**

### Index-Aware RLS

RLS conditions are optimized when backed by indexes:

```sql
-- Good: RLS uses index on user_id
CREATE INDEX idx_capsules_user_id ON public.capsules(user_id);

-- Good: RLS uses composite index
CREATE INDEX idx_capsules_user_unlock ON public.capsules(user_id, unlock_date);

-- Check if RLS is using indexes
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.capsules WHERE user_id = 'uuid'::uuid;
```

### Avoid Complex RLS Conditions

```sql
-- ❌ Slow: Complex join in RLS policy
CREATE POLICY "bad_policy" ON public.capsules
  FOR SELECT
  USING (
    user_id IN (SELECT user_id FROM public.friends WHERE friend_id = auth.uid())
  );

-- ✅ Better: Keep RLS simple, handle complexity in backend
CREATE POLICY "simple_policy" ON public.capsules
  FOR SELECT
  USING (user_id = auth.uid());
```

---

## **Security Best Practices**

1. **Always use auth.uid()**: Reference authenticated user identity.
2. **Enable RLS on all tables**: Default-allow leads to data leaks.
3. **Principle of Least Privilege**: Grant minimal necessary permissions.
4. **Audit sensitive changes**: Log all modifications for compliance.
5. **Test policies thoroughly**: Use different user accounts to verify isolation.
6. **Backend validation**: RLS is security layer; always validate on backend too.
7. **Update_at triggers**: Ensure timestamps are immutable post-unlock.

---

## **References**

- **Supabase RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **PostgreSQL Policies**: https://www.postgresql.org/docs/current/sql-createpolicy.html
- **Auth Context**: https://supabase.com/docs/guides/auth/auth-helpers/usage-with-next-js
