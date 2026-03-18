# Firebase to Supabase Migration Guide

Complete guide for migrating existing Firebase data and features to Supabase.

---

## **Overview**

This guide covers:
1. Setting up new Supabase project alongside existing Firebase
2. Exporting Firebase data
3. Transforming data for PostgreSQL
4. Importing to Supabase
5. Testing and validation
6. Switching from Firebase to Supabase (blue-green deployment)

---

## **Phase 1: Preparing for Migration**

### Step 1: Backup Firebase Data

Before any migration, export all Firebase data:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Export Firestore data
firebase firestore:export gs://your-project-bucket/firestore-backup
```

### Step 2: Set Up New Supabase Project

1. Create new Supabase project (see [SUPABASE_SETUP_GUIDE.md](SUPABASE_SETUP_GUIDE.md))
2. Run database migrations (see [SUPABASE_DATABASE_SCHEMA.md](SUPABASE_DATABASE_SCHEMA.md))
3. Configure RLS policies (see [SUPABASE_RLS_POLICIES.md](SUPABASE_RLS_POLICIES.md))
4. Set up authentication and storage

### Step 3: Create Migration Environment

Recommend keeping both Firebase and Supabase active during migration:

```env
# .env.migration
# Firebase (existing)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...

# Supabase (new)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## **Phase 2: Data Export from Firebase**

### Export Users

```typescript
// scripts/export-firebase-users.ts
import * as admin from 'firebase-admin';
import * as fs from 'fs';

admin.initializeApp({
  credential: admin.credential.cert('./firebase-key.json'),
  databaseURL: 'https://your-project.firebaseio.com',
});

const db = admin.firestore();

async function exportUsers() {
  const usersSnapshot = await db.collection('users').get();
  const users: any[] = [];

  usersSnapshot.forEach((doc) => {
    users.push({
      uid: doc.id,
      email: doc.data().email,
      displayName: doc.data().displayName || '',
      photoURL: doc.data().photoURL || null,
      createdAt: doc.data().createdAt?.toMillis() || Date.now(),
      updatedAt: doc.data().updatedAt?.toMillis() || Date.now(),
    });
  });

  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  console.log(`Exported ${users.length} users`);
}

exportUsers().catch(console.error);
```

Run:
```bash
npx ts-node scripts/export-firebase-users.ts
```

### Export Capsules

```typescript
// scripts/export-firebase-capsules.ts
import * as admin from 'firebase-admin';
import * as fs from 'fs';

admin.initializeApp({ /* ... */ });
const db = admin.firestore();

async function exportCapsules() {
  const capsulesSnapshot = await db.collection('capsules').get();
  const capsules: any[] = [];

  capsulesSnapshot.forEach((doc) => {
    capsules.push({
      id: doc.id,
      userId: doc.data().userId,
      title: doc.data().title,
      message: doc.data().message,
      mood: doc.data().mood,
      unlockDate: doc.data().unlockDate?.toMillis() || Date.now(),
      photoURL: doc.data().photoURL || null,
      createdAt: doc.data().createdAt?.toMillis() || Date.now(),
      updatedAt: doc.data().updatedAt?.toMillis() || Date.now(),
      status: 'scheduled',
      isDeleted: false,
    });
  });

  fs.writeFileSync('capsules.json', JSON.stringify(capsules, null, 2));
  console.log(`Exported ${capsules.length} capsules`);
}

exportCapsules().catch(console.error);
```

---

## **Phase 3: Data Transformation**

### Transform Timestamps

Firebase uses Timestamp objects; PostgreSQL uses ISO 8601 strings:

```typescript
// scripts/transform-data.ts
import * as fs from 'fs';

interface FirebaseUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: number; // milliseconds
  updatedAt: number;
}

interface SupabaseUser {
  id: string; // UUID
  email: string;
  display_name: string;
  photo_url: string | null;
  timezone: string | null;
  email_notifications: boolean;
  status: 'active' | 'suspended' | 'deleted';
  created_at: string; // ISO 8601
  updated_at: string;
}

function transformUser(firebaseUser: FirebaseUser): SupabaseUser {
  return {
    id: firebaseUser.uid, // Firebase UID as UUID
    email: firebaseUser.email,
    display_name: firebaseUser.displayName,
    photo_url: firebaseUser.photoURL,
    timezone: null,
    email_notifications: true,
    status: 'active',
    created_at: new Date(firebaseUser.createdAt).toISOString(),
    updated_at: new Date(firebaseUser.updatedAt).toISOString(),
  };
}

function transformCapsule(firebaseCapsule: any) {
  return {
    id: firebaseCapsule.id,
    user_id: firebaseCapsule.userId,
    title: firebaseCapsule.title,
    message: firebaseCapsule.message,
    mood: firebaseCapsule.mood,
    unlock_date: new Date(firebaseCapsule.unlockDate).toISOString(),
    photo_url: firebaseCapsule.photoURL,
    status: firebaseCapsule.status || 'scheduled',
    is_deleted: firebaseCapsule.isDeleted || false,
    created_at: new Date(firebaseCapsule.createdAt).toISOString(),
    updated_at: new Date(firebaseCapsule.updatedAt).toISOString(),
  };
}

// Run transformation
const users = JSON.parse(fs.readFileSync('users.json', 'utf-8'));
const capsules = JSON.parse(fs.readFileSync('capsules.json', 'utf-8'));

const transformedUsers = users.map(transformUser);
const transformedCapsules = capsules.map(transformCapsule);

fs.writeFileSync('users-supabase.json', JSON.stringify(transformedUsers, null, 2));
fs.writeFileSync('capsules-supabase.json', JSON.stringify(transformedCapsules, null, 2));

console.log(`Transformed ${transformedUsers.length} users and ${transformedCapsules.length} capsules`);
```

Run:
```bash
npx ts-node scripts/transform-data.ts
```

---

## **Phase 4: Data Import to Supabase**

### Method 1: Using SQL COPY (Fastest)

```sql
-- Create temporary table for users
CREATE TEMP TABLE users_import (
  id uuid,
  email text,
  display_name text,
  photo_url text,
  timezone text,
  email_notifications boolean,
  status text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

-- Copy data from CSV (export JSON to CSV first)
COPY users_import FROM '/tmp/users.csv' WITH (FORMAT csv, HEADER);

-- Insert into public.users (linking to auth.users)
-- You must create auth.users first!
INSERT INTO public.users (id, email, display_name, photo_url, timezone, email_notifications, status, created_at, updated_at)
SELECT * FROM users_import
ON CONFLICT (id) DO NOTHING;
```

### Method 2: Using Supabase JavaScript Client

```typescript
// scripts/import-to-supabase.ts
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function importUsers() {
  const users = JSON.parse(fs.readFileSync('users-supabase.json', 'utf-8'));

  // Import in batches (to avoid timeout)
  const batchSize = 100;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);

    const { error } = await supabase
      .from('users')
      .insert(batch, { ignoreDuplicates: true });

    if (error) {
      console.error(`Error importing batch ${i}:`, error);
    } else {
      console.log(`Imported ${batch.length} users (${i + batch.length}/${users.length})`);
    }
  }
}

async function importCapsules() {
  const capsules = JSON.parse(fs.readFileSync('capsules-supabase.json', 'utf-8'));

  const batchSize = 100;
  for (let i = 0; i < capsules.length; i += batchSize) {
    const batch = capsules.slice(i, i + batchSize);

    const { error } = await supabase
      .from('capsules')
      .insert(batch, { ignoreDuplicates: true });

    if (error) {
      console.error(`Error importing batch ${i}:`, error);
    } else {
      console.log(`Imported ${batch.length} capsules (${i + batch.length}/${capsules.length})`);
    }
  }
}

async function main() {
  console.log('Starting data import...');
  await importUsers();
  console.log('Users imported');
  await importCapsules();
  console.log('Capsules imported');
  console.log('Migration complete!');
}

main().catch(console.error);
```

Run:
```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx ts-node scripts/import-to-supabase.ts
```

---

## **Phase 5: User Authentication Migration**

### Challenge: Firebase Auth → Supabase Auth

Firebase stores password hashes differently. **You cannot directly import Firebase passwords.**

**Solution: Gradual migration or password reset**

#### Option A: Invite users to reset password

1. Do not import password hashes
2. Create users in Supabase without setting password
3. Send invitation email to reset password
4. User clicks link and sets new password

```typescript
// Invite user to set password
const { error } = await supabase.auth.admin.inviteUserByEmail(
  'user@example.com',
  {
    redirectTo: 'https://yourdomain.com/auth/reset-password',
  }
);
```

#### Option B: Dual authentication (transitional)

1. Keep Firebase Auth active
2. New auth requests go to Supabase
3. Old users can still login via Firebase during transition period
4. Gradually migrate users as they login

```typescript
// In API route, try Supabase first, then Firebase
async function authenticate(email: string, password: string) {
  // Try Supabase
  const { data: supabaseData, error: supabaseError } = await supabase.auth
    .signInWithPassword({ email, password });

  if (!supabaseError) {
    return supabaseData; // Success with Supabase
  }

  // Fall back to Firebase (during transition)
  try {
    const firebaseUser = await firebase.auth().signInWithEmailAndPassword(email, password);
    // Automatically create user in Supabase if not exists
    await createSupabaseUserFromFirebase(firebaseUser);
    return firebaseUser;
  } catch (error) {
    throw new Error('Authentication failed');
  }
}
```

---

## **Phase 6: Testing & Validation**

### Data Integrity Checks

```sql
-- Verify row counts match
SELECT COUNT(*) as firebase_count FROM public.users;
SELECT COUNT(*) as firebase_count FROM public.capsules;

-- Verify no orphaned capsules
SELECT c.id, c.user_id FROM public.capsules c
LEFT JOIN public.users u ON c.user_id = u.id
WHERE u.id IS NULL;

-- Verify moods are valid
SELECT DISTINCT mood FROM public.capsules
WHERE mood NOT IN ('Happy', 'Motivated', 'Confused', 'Sad', 'Grateful', 'Hopeful');

-- Check for NULL constraints
SELECT COUNT(*) FROM public.capsules WHERE title IS NULL;
SELECT COUNT(*) FROM public.capsules WHERE message IS NULL;
```

### Feature Testing Checklist

- [ ] Users can login with Supabase credentials
- [ ] Users can create new capsules
- [ ] Capsule unlock dates work correctly
- [ ] Photo uploads work via Supabase Storage
- [ ] RLS policies prevent unauthorized access
- [ ] Mood statistics calculate correctly
- [ ] Timezones display correctly
- [ ] Email notifications (if enabled) send
- [ ] Google OAuth login works

---

## **Phase 7: Blue-Green Deployment**

### Keep both systems running, switch traffic gradually

```
State 1: Firebase Active, Supabase Standby
  ├─ Users → Firebase (read/write)
  └─ Background: Sync new data to Supabase

State 2: Both Active (Dual Write)
  ├─ Users → Firebase (read), Supabase (write)
  └─ Verify data consistency

State 3: Supabase Active, Firebase Standby
  ├─ Users → Supabase (read/write)
  └─ Firebase available for rollback

State 4: Decommission Firebase
  ├─ Archive Firebase data
  └─ Supabase is source of truth
```

### Implementation: Feature Flag

```typescript
// lib/use-backend.ts
const USE_SUPABASE = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';

export async function getCapsules() {
  if (USE_SUPABASE) {
    return getCapsulesFromSupabase();
  } else {
    return getCapsulesFromFirebase();
  }
}
```

In `.env`:
```env
# Gradually change this to 'true'
NEXT_PUBLIC_USE_SUPABASE=false → true (when ready)
```

---

## **Phase 8: Rollback Plan**

If something goes wrong:

1. **Immediate**: Revert environment variables to Firebase
2. **Short-term**: Keep both systems running for 24-48 hours
3. **Analysis**: Identify issue in Supabase
4. **Fix**: Correct database/RLS policies
5. **Re-test**: Validate all features
6. **Retry**: Cutover again

**Backup procedures**:
```bash
# Export Supabase data before cutover
supabase db pull --project-id your-project-id > backup.sql

# Restore if needed
supabase db push < backup.sql
```

---

## **Phase 9: Decommission Firebase**

After successful migration:

1. Archive Firebase project (don't delete immediately)
2. Export final data backup
3. Update all documentation
4. Remove Firebase credentials from `.env*`
5. Remove Firebase SDK from dependencies
6. Clean up Firebase-specific components (optional)

```bash
# Remove Firebase packages
npm uninstall firebase

# Update imports in code
- import { getAuth } from 'firebase/auth'
+ import { useAuth } from '@libs/supabase-config'
```

---

## **Troubleshooting Migration Issues**

### Issue: UIDs don't match between systems

**Cause**: Firebase and Supabase use different ID formats.

**Solution**: Map Firebase UID → Supabase UUID during import:
```typescript
const supabaseUser = {
  id: firebaseUid, // Use Firebase UID as UUID in Supabase
  email: firebaseUser.email,
  // ...
};
```

### Issue: Timestamps show different times

**Cause**: Timezone conversion errors.

**Fix**: Always use UTC and ISO 8601 format:
```typescript
// Convert Firebase timestamp to UTC ISO string
const isoString = new Date(firebaseTimestamp.toMillis()).toISOString();
```

### Issue: RLS policies block imported data

**Cause**: RLS expects data in specific format.

**Solution**: Verify RLS policies match data format:
```sql
-- Check if INSERT works
INSERT INTO public.capsules (user_id, title, message, mood, unlock_date)
VALUES ('user-uuid', 'Test', 'Message', 'Happy', now() + interval '1 day');
```

### Issue: Storage photos don't display

**Cause**: Photo URLs point to Firebase Storage, not Supabase.

**Solution**: Download Firebase photos and re-upload to Supabase:
```typescript
async function migratePhotos(capsules: Capsule[]) {
  for (const capsule of capsules) {
    if (!capsule.photo_url) continue;

    // Download from Firebase
    const firebaseUrl = capsule.photo_url;
    const blob = await fetch(firebaseUrl).then(r => r.blob());

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from('capsule-photos')
      .upload(`${capsule.user_id}/${capsule.id}/photo.jpg`, blob);

    if (!error) {
      // Update capsule with new URL
      await supabase
        .from('capsules')
        .update({ photo_url: data.path })
        .eq('id', capsule.id);
    }
  }
}
```

---

## **References**

- **Firebase Export**: https://cloud.google.com/firestore/docs/manage-data/export-import
- **Supabase Import**: https://supabase.com/docs/guides/database/importing-data
- **Data Type Mapping**: https://www.postgresql.org/docs/current/datatype.html
