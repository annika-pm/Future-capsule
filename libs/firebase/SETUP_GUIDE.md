# Firebase & Firestore Setup Guide

## Table of Contents
1. [Firebase Project Creation](#firebase-project-creation)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Troubleshooting](#troubleshooting)

---

## Firebase Project Creation

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"** or **"Add project"**
3. Enter project name: `futurecapsule` (or your preference)
4. Choose analytics settings (optional, can enable later)
5. Select default location (US Central recommended)
6. Click **"Create project"** and wait for provisioning

### Step 2: Create Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in production mode"** (we'll configure security rules)
4. Select region: **us-central1** (or closest to your users)
5. Click **"Enable"**
6. Wait for database initialization

### Step 3: Enable Cloud Storage

1. In Firebase Console, go to **Storage**
2. Click **"Get started"**
3. Accept default bucket location (matches Firestore region)
4. Set CORS rules:
   ```json
   [
     {
       "origin": ["https://yourdomain.com", "http://localhost:3000"],
       "method": ["GET", "PUT", "POST", "DELETE"],
       "responseHeader": ["Content-Type"],
       "maxAgeSeconds": 3600
     }
   ]
   ```
   Apply via `gsutil` command (see Cloud Storage docs)

### Step 4: Enable Authentication

1. Go to **Authentication**
2. Click **"Get started"**
3. Enable **Email/Password**:
   - Sign-in providers → Email/Password
   - Toggle "Email/Password" on
   - Optionally enable "Email link (passwordless sign-in)"
4. Enable **Google Sign-In**:
   - Sign-in providers → Google
   - Select project support email
   - Add authorized domains (localhost, your domain)

### Step 5: Collect Configuration

1. Go to **Project Settings** (click gear icon)
2. Under "Your apps", click or create a web app (`</>`)
3. Copy Firebase configuration:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "futurecapsule-abc123.firebaseapp.com",
     projectId: "futurecapsule-abc123",
     storageBucket: "futurecapsule-abc123.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123def456"
   };
   ```
4. Save these values (you'll need them for environment variables)

---

## Local Development Setup

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
```

### Step 2: Install Firebase Emulator

```bash
firebase init emulators
```

When prompted:
- Which emulators? Select: **Firestore**, **Auth**, **Storage**
- Firestore port: `8080` (default)
- Auth port: `9099` (default)
- Storage port: `4000` (default)

This creates `firebase.json`:
```json
{
  "emulators": {
    "firestore": {
      "port": 8080
    },
    "auth": {
      "port": 9099
    },
    "storage": {
      "port": 4000
    }
  }
}
```

### Step 3: Start the Emulator

In the workspace root:
```bash
firebase emulators:start
```

Expected output:
```
✔ Firestore Emulator started at http://localhost:8080
✔ Auth Emulator started at http://localhost:9099
✔ Storage Emulator started at http://localhost:4000
```

Keep this terminal running during development.

### Step 4: Configure Environment Variables

Create `.env.local` in the workspace root:
```env
# Firebase Configuration (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=futurecapsule-xyz.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=futurecapsule-xyz
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=futurecapsule-xyz.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456

# Environment Control
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_USE_EMULATOR=true

# Analytics (Optional)
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXX
```

### Step 5: Update Next.js App Configuration

In `apps/future-capsule/src/lib/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFirebaseConfig, emulatorConfig } from '@monorepo/firebase-config';

const firebaseApp = initializeApp(getFirebaseConfig());

// Initialize services
export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export const database = firestore; // Alias for convenience

// Connect to emulators in development
if (emulatorConfig.enabled) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(firestore, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 4000);
  } catch (e) {
    // Emulator already connected
  }
}
```

### Step 6: Deploy Security Rules to Emulator

The emulator uses default open rules. To test actual security:

```bash
firebase emulators:start --import=./firestore-seed.json
```

(See "Seeding Data" below for seed file format)

---

## Production Deployment

### Step 1: Deploy Firestore Security Rules

1. Update `libs/firebase/firestore.rules` with production rules
2. In workspace root:
   ```bash
   firebase deploy --only firestore:rules
   ```
3. Verify deployment in Firebase Console → Firestore → Rules

### Step 2: Create Firestore Indexes

For optimal query performance, deploy indexes:

```bash
firebase deploy --only firestore:indexes
```

The required indexes are automatically detected when you run complex queries in production. Firebase will suggest indexes in the console.

**Get index details**:
```bash
firebase firestore:indexes
```

**Manual Index Deployment**:
Create `firestore.indexes.json`:
```json
{
  "indexes": [
    {
      "collectionGroup": "capsules",
      "queryScope": "Collection",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "unlockDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "capsules",
      "queryScope": "Collection",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

Then deploy:
```bash
firebase deploy --only firestore:indexes
```

### Step 3: Set Cloud Storage CORS (if using client-side uploads)

Create `storage.cors.json`:
```json
[
  {
    "origin": ["https://yourdomain.com"],
    "method": ["GET", "PUT", "POST", "DELETE"],
    "responseHeader": ["Content-Type", "x-goog-storage-version-id"],
    "maxAgeSeconds": 3600
  }
]
```

Deploy via gsutil:
```bash
gsutil cors set storage.cors.json gs://your-bucket-name.appspot.com
```

### Step 4: Configure Firestore Backups (Optional but Recommended)

1. Firebase Console → Firestore → Backups
2. Click **"Add backup schedule"**
3. Set frequency: Weekly or Daily
4. Set retention: 30 days
5. Click **"Create"**

### Step 5: Enable Cloud Logging (for compliance/debugging)

1. Firebase Console → Firestore → Data Access Logs
2. Enable "Data Access audit logs"
3. View logs in Cloud Logging console

### Step 6: Set Up Vercel Deployment

In your Vercel project settings, add environment variables:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=futurecapsule-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=futurecapsule-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=futurecapsule-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_USE_EMULATOR=false
```

---

## Environment Configuration

### Development (.env.local)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-dev-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=futurecapsule-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=futurecapsule-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=futurecapsule-dev.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=dev-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=dev-app-id
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_USE_EMULATOR=true
```

### Staging (Vercel)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-staging-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=futurecapsule-staging.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=futurecapsule-staging
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=futurecapsule-staging.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=staging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=staging-app-id
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_USE_EMULATOR=false
```

### Production (Vercel)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-prod-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=futurecapsule.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=futurecapsule-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=futurecapsule-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=prod-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=prod-app-id
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_USE_EMULATOR=false
```

### Service Account (Backend/Firebase Admin SDK)

For Next.js API routes using Firebase Admin SDK:

1. Firebase Console → Project Settings → Service Accounts
2. Click **"Generate new private key"**
3. Save as `service-account-key.json` (add to `.gitignore`)
4. Set environment variable:
   ```env
   FIREBASE_ADMIN_SDK_KEY=<path-to-service-account-key.json>
   ```

**Usage in API routes**:
```typescript
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY!)
    ),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();
const auth = admin.auth();
```

---

## Seeding Data (Development)

Create `firestore-seed.json` for test data:

```json
{
  "__meta__": {
    "version": "4.11.1"
  },
  "users": [
    {
      "reference": "users/testuser123",
      "data": {
        "uid": "testuser123",
        "email": "test@example.com",
        "displayName": "Test User",
        "createdAt": 1678500000000,
        "updatedAt": 1678500000000,
        "status": "active"
      }
    }
  ],
  "capsules": [
    {
      "reference": "users/testuser123/capsules/capsule001",
      "data": {
        "id": "capsule001",
        "userId": "testuser123",
        "title": "My First Capsule",
        "message": "This is a test message written today.",
        "mood": "Happy",
        "unlockDate": 1679000000000,
        "createdAt": 1678500000000,
        "updatedAt": 1678500000000,
        "isDeleted": false,
        "status": "scheduled"
      }
    }
  ]
}
```

Load seed data:
```bash
firebase emulators:start --import=./firestore-seed.json
```

After testing, export data:
```bash
firebase emulators:export ./firestore-export
```

---

## Troubleshooting

### Firebase Emulator Won't Start

**Problem**: `Error: Firestore emulator failed to start`

**Solution**:
```bash
# Kill existing process on port 8080
lsof -i :8080
kill -9 <PID>

# Restart emulator
firebase emulators:start
```

### Cannot Connect to Firestore from Next.js App

**Check**:
1. `.env.local` has `NEXT_PUBLIC_USE_EMULATOR=true`
2. Emulator is running (`firebase emulators:start`)
3. Ports match: 8080 (Firestore), 9099 (Auth)

**Error**: `Failed to get document because the client is offline`

**Solution**:
```typescript
// In firebase.ts, add:
enableNetwork(firestore);
```

### Firestore Rules Permission Denied in Production

**Check**:
1. Rules deployed: `firebase deploy --only firestore:rules`
2. User is authenticated
3. User ID matches `userId` field in document
4. Security rules syntax is valid

**Validate rules**:
```bash
firebase emulators:start --only firestore
# Test rules locally before deploying
```

### Too Many Indexes Error

**Problem**: Firebase creates too many indexes from development queries

**Solution**:
- Regularly review used indexes in Firebase Console
- Delete unused indexes
- Use specific query patterns with filters

### Token Expiration Issues

**Problem**: User gets logged out unexpectedly

**Solution**: Firebase SDK auto-refreshes tokens. Ensure:
```typescript
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
```

### Cloud Storage CORS Error

**Problem**: Browser blocks `gs://bucket/file` access

**Solution**: Upload through HTTPS URLs:
```typescript
// Instead of: gs://bucket/file
// Use: https://storage.googleapis.com/bucket/file
```

Or configure CORS:
```bash
gsutil cors set storage.cors.json gs://bucket-name.appspot.com
```

---

## Deployment Checklist

### Pre-Production (Dev/Staging)
- [ ] Firebase project created with both Firestore and Auth
- [ ] Firestore emulator working locally
- [ ] Auth emulator working locally
- [ ] `.env.local` configured with dev credentials
- [ ] Test data seeded in emulator
- [ ] Firestore security rules reviewed (use production mode rules locally)
- [ ] API endpoints tested with valid/invalid auth
- [ ] Cloud Storage CORS configured

### Production Deployment
- [ ] Production Firebase project created (separate from dev)
- [ ] Firestore database initialized in production
- [ ] Security rules deployed to production
- [ ] Composite indexes deployed
- [ ] Cloud Storage bucket created and CORS configured
- [ ] Backups enabled
- [ ] Cloud Logging enabled
- [ ] Service account key generated for backend
- [ ] Vercel environment variables configured
- [ ] Auth domain authorized in Firebase Console
- [ ] Email provider configured (e.g., Firebase Auth emails)
- [ ] Production Next.js app deployed to Vercel
- [ ] Test complete auth flow (signup, login, Google)
- [ ] Test capsule CRUD operations
- [ ] Test capsule unlock validation after unlock date
- [ ] Monitor error logs in Cloud Logging

---

## Reference Commands

```bash
# Start emulator
firebase emulators:start

# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# List indexes
firebase firestore:indexes

# Export data
firebase emulators:export ./backup

# Clear emulator data
firebase emulators:start --clear

# View logs
firebase functions:log

# Authentication
firebase auth:list-providers

# Help
firebase help deploy
```

---

## Next Steps

After completing this setup:
1. Review [api-contract.md](./api-contract.md) for all API endpoints
2. Review [firestore-schema.md](./firestore-schema.md) for data structures
3. Read [firestore.rules](./firestore.rules) for security configuration
4. Begin frontend implementation in `apps/future-capsule`
