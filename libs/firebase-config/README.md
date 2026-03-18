# Firebase Configuration Library

## Overview

The `firebase-config` library provides centralized Firebase configuration management for the FutureCapsule application. It handles loading, validating, and providing environment-specific configuration to all parts of the application.

## Features

- ✅ Environment-based configuration (dev, staging, production)
- ✅ Validation of required Firebase credentials
- ✅ Support for multiple Firebase projects
- ✅ Emulator configuration for local development
- ✅ TypeScript definitions for type safety
- ✅ Clear error messages for misconfiguration

## Installation

```bash
npm install @monorepo/firebase-config
```

## Usage

### Basic Setup

In your Firebase initialization file (e.g., `apps/future-capsule/src/lib/firebase.ts`):

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFirebaseConfig, getFirebaseEnvironment } from '@monorepo/firebase-config';

// Get configuration from environment variables
const config = getFirebaseConfig();

// Initialize Firebase
const firebaseApp = initializeApp(config);

// Get Firebase services
export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);

// Check environment
const env = getFirebaseEnvironment();
console.log(`Initialized Firebase in ${env.environment} mode`);
```

### Using Emulator

For local development with Firebase Emulator:

```typescript
import { 
  getFirebaseConfig, 
  emulatorConfig,
  getFirebaseEnvironment 
} from '@monorepo/firebase-config';

const config = getFirebaseConfig();
const env = getFirebaseEnvironment();

const firebaseApp = initializeApp(config);
const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);

// Connect to emulators if enabled
if (emulatorConfig.enabled) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(firestore, 'localhost', 8080);
  connectStorageEmulator(getStorage(firebaseApp), 'localhost', 4000);
}
```

### Type Safety

All exported types are fully typed:

```typescript
import type { FirebaseConfig } from '@monorepo/firebase-config';

// Your config is type-safe
const config: FirebaseConfig = getFirebaseConfig();

// Access properties with IDE autocomplete
console.log(config.projectId);  // ✅ TypeScript knows this exists
console.log(config.unknown);    // ❌ TS error: property does not exist
```

## Configuration API

### `getFirebaseConfig(): FirebaseConfig`

Returns the Firebase configuration object with all required credentials.

**Returns**:
```typescript
{
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string; // Optional
}
```

**Throws**: 
- `Error` if required environment variables are missing

**Example**:
```typescript
const config = getFirebaseConfig();
// {
//   apiKey: "AIzaSy...",
//   authDomain: "futurecapsule-dev.firebaseapp.com",
//   projectId: "futurecapsule-dev",
//   ...
// }
```

### `getFirebaseEnvironment()`

Returns environment-specific settings.

**Returns**:
```typescript
{
  isDevelopment: boolean;
  isProduction: boolean;
  environment: 'development' | 'staging' | 'production';
  firestoreDatabaseId?: string;
}
```

**Example**:
```typescript
const env = getFirebaseEnvironment();

if (env.isDevelopment) {
  enableDebugLogging();
}

if (env.isProduction) {
  enableCrashReporting();
}
```

### `emulatorConfig`

Configuration for Firebase Emulator Suite.

**Properties**:
```typescript
{
  enabled: boolean;         // true if NEXT_PUBLIC_USE_EMULATOR=true
  firestorePort: number;    // Default: 8080
  authPort: number;         // Default: 9099
  storageBucket: string;    // Default: 'localhost:4000'
}
```

**Example**:
```typescript
if (emulatorConfig.enabled) {
  console.log(`Firestore emulator running on localhost:${emulatorConfig.firestorePort}`);
}
```

## Environment Variables

### Required Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

### Optional Variables

```env
# Environment setting
NEXT_PUBLIC_ENVIRONMENT=development    # development | staging | production

# Use local emulator (for offline development)
NEXT_PUBLIC_USE_EMULATOR=true

# Firebase Analytics (optional)
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXX

# Multiple database support (optional)
NEXT_PUBLIC_FIRESTORE_DATABASE_ID=default
```

## Error Handling

The library provides clear error messages for misconfiguration:

```typescript
try {
  const config = getFirebaseConfig();
} catch (error) {
  // Error: Missing required Firebase environment variables: 
  // NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_PROJECT_ID
  // Please check your .env.local or Vercel environment configuration.
}
```

**Resolution**:
1. Copy `.env.example` to `.env.local`
2. Get credentials from [Firebase Console](https://console.firebase.google.com)
3. Fill in all required variables
4. Restart your development server

## Development vs Production

### Development Configuration

```env
NEXT_PUBLIC_FIREBASE_API_KEY=dev-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=futurecapsule-dev
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_USE_EMULATOR=true
```

**Behavior**:
- Uses local Firebase Emulator for offline development
- No Firebase Analytics
- Debug mode enabled

### Production Configuration

```env
NEXT_PUBLIC_FIREBASE_API_KEY=prod-key
NEXT_PUBLIC_FIREBASE_PROJECT_ID=futurecapsule-prod
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_USE_EMULATOR=false
```

**Behavior**:
- Connects to production Firebase project
- Real data stored in Firestore
- Optimized performance

## Best Practices

### 1. Separate Projects for Environments

Create distinct Firebase projects for each environment:
- `futurecapsule-dev` (development)
- `futurecapsule-staging` (staging)
- `futurecapsule-prod` (production)

This prevents accidental data mixing and allows role-based access control.

### 2. Validate Configuration on App Load

```typescript
// In your app's root component or _app.tsx
useEffect(() => {
  try {
    const config = getFirebaseConfig();
    console.log(`✅ Firebase configured for ${config.projectId}`);
  } catch (error) {
    console.error('❌ Firebase configuration error:', error.message);
    // Show error UI to user
  }
}, []);
```

### 3. Use Environment Function for Conditional Logic

```typescript
import { getFirebaseEnvironment } from '@monorepo/firebase-config';

const env = getFirebaseEnvironment();

// Instead of:
if (process.env.NEXT_PUBLIC_ENVIRONMENT === 'dev') { // ❌ String comparison

// Use:
if (env.isDevelopment) { // ✅ Type-safe boolean
  enableDebugger();
}
```

### 4. Handle Emulator Connection Errors

```typescript
try {
  if (emulatorConfig.enabled) {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(firestore, 'localhost', 8080);
  }
} catch (error) {
  if (emulatorConfig.enabled) {
    console.warn('Emulator already connected');
  }
}
```

## TypeScript Integration

This library is fully typed and works with strict TypeScript:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}
```

All configuration values are properly typed:
```typescript
const config = getFirebaseConfig();
const projectId: string = config.projectId;  // ✅ Correct type
const invalidField: string = config.unknown; // ❌ TS Error
```

## Monorepo Integration

This library can be used from any app in the Nx monorepo:

```typescript
// From next app
import { getFirebaseConfig } from '@monorepo/firebase-config';

// From React app  
import { getFirebaseEnvironment } from '@monorepo/firebase-config';

// From any other project
import type { FirebaseConfig } from '@monorepo/firebase-config';
```

Update `tsconfig.base.json` to expose the library:
```json
{
  "paths": {
    "@monorepo/firebase-config": ["libs/firebase-config/src/index.ts"]
  }
}
```

## Advanced Usage

### Custom Initialization

```typescript
import { getFirebaseConfig, firebaseInitOptions } from '@monorepo/firebase-config';

const config = getFirebaseConfig();
const firebaseApp = initializeApp(config);

// Apply custom options
if (firebaseInitOptions.debug) {
  connectFunctionsEmulator(getFunctions(), 'localhost', 5001);
}
```

### Multiple Projects (Future Feature)

If you need multiple Firebase projects in one app:

```typescript
export function getFirebaseConfigForEnvironment(env: 'dev' | 'prod') {
  const overrides = {
    projectId: env === 'dev' 
      ? process.env.NEXT_PUBLIC_FIREBASE_DEV_PROJECT_ID
      : process.env.NEXT_PUBLIC_FIREBASE_PROD_PROJECT_ID,
    // other overrides
  };
  
  return { ...getFirebaseConfig(), ...overrides };
}
```

## Troubleshooting

### Error: "Cannot find module '@monorepo/firebase-config'"

**Solution**: 
1. Ensure the library is defined in `tsconfig.base.json` paths
2. Run `npm install` to install dependencies
3. Restart IDE

### Error: "Missing required Firebase environment variables"

**Solution**:
1. Copy `.env.example` to `.env.local`
2. Get credentials from [Firebase Console](https://console.firebase.google.com)
3. Fill in required variables
4. Restart dev server: `npm start`

### Emulator Connection Failed

**Solution**:
```bash
# Start emulator in separate terminal
firebase emulators:start

# Check if running
lsof -i :8080  # Firestore
lsof -i :9099  # Auth
```

## Contributing

When updating this library:
1. Update types in `config.ts`
2. Add environment variables to `.env.example`
3. Update this README
4. Test in both dev and production environments
5. Create PR with clear description

## References

- [Firebase Console](https://console.firebase.google.com)
- [Firebase Web SDK Docs](https://firebase.google.com/docs/web/setup)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [FutureCapsule Setup Guide](../../firebase/SETUP_GUIDE.md)
