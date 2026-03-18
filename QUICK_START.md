# 🚀 Supabase Migration - Quick Start Guide

**Get up and running in < 30 minutes**

---

## ⚡ 5-Minute Supabase Setup

### 1. Create Project (2 min)
```
1. Go to supabase.com
2. Click "New Project"
3. Fill in project name, password, region
4. Wait for project to initialize
```

### 2. Get Credentials (2 min)
```
1. Project Settings → API
2. Copy "Project URL" → NEXT_PUBLIC_SUPABASE_URL
3. Copy "Anon Key" → NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Copy "Service Role Key" → SUPABASE_SERVICE_ROLE_KEY
5. Project Settings → General
6. Copy "JWT Secret" → SUPABASE_JWT_SECRET
```

### 3. Copy `.env.local`
```bash
cp .env.example .env.local
# Edit .env.local with your values from step 2
```

---

## 🗄️ 5-Minute Database Setup

### Run in Supabase SQL Editor

```sql
-- Create capsules table
CREATE TABLE capsules (
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

-- Create indexes
CREATE INDEX idx_capsules_user_id ON capsules(user_id);
CREATE INDEX idx_capsules_unlock_date ON capsules(unlock_date);

-- Enable RLS
ALTER TABLE capsules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own capsules" ON capsules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create capsules" ON capsules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own capsules" ON capsules
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own capsules" ON capsules
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER capsules_updated_at_trigger
BEFORE UPDATE ON capsules
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

---

## 🔐 5-Minute Google OAuth Setup

### In Supabase Console

```
1. Authentication → Providers → Google
2. Click "Enable"
3. Paste your Google OAuth credentials
   (Get from Google Cloud Console)
4. Add Redirect URI: http://localhost:3000/auth/callback
5. Save
```

### Google Cloud Console
```
1. Go to console.cloud.google.com
2. Create new OAuth 2.0 credential (Desktop app)
3. Copy Client ID and Secret
4. Paste into Supabase
```

---

## 💻 Install & Run (5 min)

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Open browser
# http://localhost:3000
```

---

## ✅ Test Flows

### 1. Email Sign Up
```
1. Click Sign Up
2. Enter email, password, display name
3. Accept confirmation
4. Should redirect to dashboard
```

### 2. Email Sign In
```
1. Click Sign In
2. Enter email and password
3. Should redirect to dashboard
```

### 3. Google Sign In
```
1. Click "Sign In with Google"
2. Select Google account
3. Should redirect to dashboard
```

### 4. Create Capsule
```
1. Click "Create Capsule"
2. Fill form (title, message, mood, date)
3. Click "Create"
4. Should appear in dashboard list
```

### 5. View Capsule
```
1. Click capsule in list
2. If locked: see preview
3. If unlocked: see full message
```

### 6. Edit Capsule
```
1. Only possible BEFORE unlock date
2. Can change: title, message, mood, photo
3. Cannot change: unlock date
```

### 7. Delete Capsule
```
1. Click delete button
2. Confirm deletion
3. Should disappear from list
```

---

## 🐛 Troubleshooting

### Error: "Missing environment variables"
```
✓ Check NEXT_PUBLIC_SUPABASE_URL is set
✓ Check NEXT_PUBLIC_SUPABASE_ANON_KEY is set
✓ Restart dev server (npm run dev)
```

### Error: "RLS policy denied"
```
✓ Verify RLS policies are enabled in Supabase
✓ Check user_id matches auth.uid()
✓ Test policy in SQL editor
```

### Error: "Invalid JWT token"
```
✓ Add SUPABASE_JWT_SECRET to .env.local
✓ Get from Supabase Project Settings
✓ Restart dev server
```

### Error: "Redirect URI mismatch"
```
✓ For localhost: http://localhost:3000/auth/callback
✓ For production: https://yourdomain.com/auth/callback
✓ Add in Supabase Authentication settings
```

### Email not receiving verification
```
✓ Check spam folder
✓ Disable email confirmation for testing:
  - Authentication → Email → Uncheck "Confirm email"
✓ Watch Supabase logs for errors
```

---

## 📁 Key Files (Quick Reference)

### Configuration
- `.env.local` - Your secrets
- `apps/future-capsule/src/lib/supabase.ts` - Client config

### Authentication
- `apps/future-capsule/src/app/login/page.tsx` - Login form
- `apps/future-capsule/src/app/signup/page.tsx` - Signup form
- `apps/future-capsule/src/hooks/useAuth.ts` - Auth logic

### Capsules
- `apps/future-capsule/src/hooks/useCapsules.ts` - API hooks
- `apps/future-capsule/src/app/api/capsules/route.ts` - API endpoints
- `apps/future-capsule/src/app/api/capsules/[id]/route.ts` - ID endpoints

### Security
- `apps/future-capsule/src/middleware/auth-middleware.ts` - JWT verification

---

## 🚀 Deploy to Vercel (5 min)

```bash
# 1. Commit changes
git add .
git commit -m "Migrate to Supabase"
git push

# 2. Go to vercel.com/dashboard
# 3. Import your GitHub repo
# 4. Add environment variables:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY
#    - SUPABASE_SERVICE_ROLE_KEY
#    - SUPABASE_JWT_SECRET
#
# 5. Click Deploy
# 6. Update Google OAuth redirect URI to Vercel domain
```

---

## 📚 Full Documentation

For detailed information, see:
- **Setup Guide**: `SUPABASE_FRONTEND_MIGRATION.md`
- **Database Setup**: `SUPABASE_DATABASE_SETUP.md`
- **Complete Summary**: `MIGRATION_COMPLETE_SUMMARY.md`

---

## 🎉 You're Ready!

All the code is written. Just:
1. Create Supabase project
2. Set up database with SQL
3. Configure Google OAuth
4. Add environment variables
5. Run `npm install && npm run dev`
6. Test locally
7. Deploy to Vercel

**That's it!** 🚀

