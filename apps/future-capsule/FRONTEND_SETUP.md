# FutureCapsule Frontend - Phase 1 Infrastructure Setup

## Overview

This document describes the Next.js frontend infrastructure for FutureCapsule, a letters-to-future-self platform. Phase 1 establishes the authentication system, protected routes, and layout foundation.

**Stack**: Next.js 16+ (App Router), TypeScript, Tailwind CSS, Framer Motion, Firebase SDK

---

## Quick Start

### 1. Environment Setup

Copy `.env.example` from the workspace root to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Firebase project credentials from the [Firebase Console](https://console.firebase.google.com):

```env
# Get these from: Firebase Console → Project Settings → Your apps

NEXT_PUBLIC_FIREBASE_API_KEY=                       # Web API Key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...firebaseapp.com # Auth domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id    # Project ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=....appspot.com # Storage bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456     # Cloud Messaging ID
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc         # App ID

# Environment
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_USE_EMULATOR=true  # Set to false for live Firebase
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

All needed dependencies are already in `package.json`:
- `firebase@^12.10.0` - Firebase SDK
- `framer-motion@^12.35.2` - Animations
- `next@~16.0.1` - Next.js
- `tailwindcss@3.4.3` - Styling
- `typescript@~5.9.2` - Type safety

### 3. Run Development Server

```bash
npm run dev
# or
nx serve future-capsule
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Architecture

### Directory Structure

```
apps/future-capsule/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Public auth pages
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── dashboard/page.tsx        # Protected: main dashboard
│   │   ├── timeline/page.tsx         # Protected: timeline view
│   │   ├── create/page.tsx           # Protected: create capsule
│   │   ├── capsule/[id]/page.tsx    # Protected: view capsule
│   │   ├── layout.tsx                # Root layout with auth
│   │   ├── page.tsx                  # Redirect based on auth state
│   │   └── global.css                # Tailwind & global styles
│   │
│   ├── components/
│   │   ├── auth/                     # Auth-specific components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   └── GoogleSignInButton.tsx
│   │   ├── capsule/                  # Capsule-related components
│   │   │   ├── CapsuleCard.tsx
│   │   │   ├── CapsuleForm.tsx
│   │   │   ├── CapsuleViewer.tsx
│   │   │   └── CountdownTimer.tsx
│   │   ├── layout/                   # Layout components
│   │   │   ├── Header.tsx
│   │   │   └── ProtectedLayout.tsx
│   │   └── shared/                   # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Input.tsx (+ Textarea)
│   │       ├── Card.tsx
│   │       ├── Badge.tsx
│   │       ├── Modal.tsx (+ ConfirmModal)
│   │       └── Loading.tsx (spinner, skeleton)
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx           # Global auth state
│   │
│   ├── hooks/
│   │   ├── useAuth.ts                # Access auth context
│   │   ├── useCapsules.ts            # Fetch capsules
│   │   └── useCountdown.ts           # Live countdown timer
│   │
│   ├── lib/
│   │   ├── firebase.ts               # Firebase initialization
│   │   ├── api-client.ts             # Unified API requests
│   │   └── utils.ts                  # Helpers (countdown, formatting)
│   │
│   └── types/
│       ├── index.ts                  # Centralized type exports
│       ├── user.ts                   # User & auth types
│       └── capsule.ts                # Capsule types & moods
│
├── middleware.ts                     # Next.js middleware (route protection)
├── tailwind.config.js                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
├── next.config.js                    # Next.js configuration
└── project.json                      # Nx project configuration
```

---

## Core Components

### 1. Firebase Integration (`lib/firebase.ts`)

Initializes Firebase with environment variables:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

Uses env vars from `libs/firebase-config/src/` for validation.

### 2. Authentication Context (`contexts/AuthContext.tsx`)

Global auth state provider with methods:

```typescript
const { user, isLoading, error, signup, login, signInWithGoogle, logout } = useAuth();
```

**Features**:
- ✅ Email/password signup & login (Firebase Auth)
- ✅ Google Sign-In (OAuth popup)
- ✅ Auto-login on page load (auth state persistence)
- ✅ Error handling & display
- ✅ Session management (automatic token refresh)

### 3. Protected Routes (`components/layout/ProtectedLayout.tsx`)

Client-side route protection wrapper:

```typescript
<ProtectedLayout>
  {/* Only renders if user is authenticated */}
  <DashboardPage />
</ProtectedLayout>
```

**Behavior**:
- Checks if user is authenticated
- Shows loading spinner while checking
- Redirects to `/login` if not authenticated
- Shows actual page only when authenticated

### 4. Shared UI Components

#### Button
```typescript
<Button variant="primary" size="md" isLoading={false}>
  Click me
</Button>
// Variants: primary | secondary | outline | ghost
// Sizes: sm | md | lg
```

#### Input & Textarea
```typescript
<Input
  label="Email"
  type="email"
  error={errorMessage}
  helperText="Enter your email"
  placeholder="user@example.com"
/>
```

#### Modal & ConfirmModal
```typescript
<ConfirmModal
  isOpen={isOpen}
  title="Delete capsule?"
  message="This action cannot be undone."
  isDangerous={true}
  onConfirm={handleDelete}
  onCancel={handleCancel}
/>
```

#### Badge
```typescript
<Badge variant="success" size="sm">
  Ready to open
</Badge>
// Variants: default | success | warning | danger
```

#### Loading
```typescript
<LoadingSpinner size="lg" />
<Skeleton className="h-12 w-full" />
<CardSkeleton /> {/* Pre-built card skeleton */}
```

---

## Authentication Flow

### Signup Flow

1. User fills signup form (email, password)
2. `SignupForm` validates input:
   - Required fields
   - Password ≥ 8 characters
   - Passwords match
   - Password strength indicator
3. Calls `useAuth().signup(email, password)`
4. Firebase creates account (`createUserWithEmailAndPassword`)
5. Redirects to `/dashboard` on success
6. Shows error message on failure

### Login Flow

1. User enters email & password
2. `LoginForm` validates input
3. Calls `useAuth().login(email, password)`
4. Firebase authenticates (`signInWithEmailAndPassword`)
5. Redirects to `/dashboard` on success
6. Shows error message on failure

### Google Sign-In Flow

1. User clicks "Sign in with Google"
2. Firebase opens Google OAuth popup
3. User authenticates with Google account
4. Firebase creates/links account
5. Redirects to `/dashboard`

### Logout Flow

1. User clicks logout button in Header
2. Calls `useAuth().logout()`
3. Firebase signs out (`signOut`)
4. AuthContext clears user state
5. Redirects to `/login`

---

## Design System

### Colors

The FutureCapsule theme is configured in `tailwind.config.js`:

| Purpose | Color | Hex | Usage |
|---------|-------|-----|-------|
| **Primary** | Purple | `#6B39F2` | Buttons, links, UI accents |
| **Secondary** | Neon Blue | `#00D9FF` | Highlights, hover states |
| **Background** | Midnight Black | `#0F0F14` | Dark mode background |
| **Text (Dark)** | Light Gray | `#f4f4f5` | Text on dark backgrounds |

### Tailwind Classes

- **Backgrounds**: `bg-dark`, `bg-dark-secondary`, `bg-purple-600`, `bg-blue-400`
- **Text**: `text-purple-600`, `text-blue-400`, `dark:text-gray-100`
- **Borders**: `border-gray-200`, `dark:border-gray-700`
- **Shadows**: `shadow-sm`, `shadow-glow`, `shadow-glow-blue`
- **Animations**: `animate-spin`, `animate-pulse`, `animate-fade-in`, `animate-slide-up`

### Responsive Design

All components are mobile-first responsive:

```typescript
<div className="hidden sm:flex">  {/* Hidden on mobile */}
  Desktop navigation
</div>
```

- `sm`: 640px and up
- `md`: 768px and up
- `lg`: 1024px and up

---

## Middleware & Route Protection

### Middleware (`middleware.ts`)

Currently provides documentation for future server-side auth validation. Route protection is implemented client-side:

1. **Root page** (`page.tsx`) redirects based on auth state
2. **ProtectedLayout** wraps protected pages
3. **Firestore Security Rules** enforce data-level access

### Protected Routes

Pages that require authentication:
- `/dashboard` - Main dashboard (list of capsules)
- `/timeline` - Chronological timeline view
- `/create` - Create new capsule form
- `/capsule/[id]` - View individual capsule

### Public Routes

Accessible without authentication:
- `/login` - Login page
- `/signup` - Signup page
- `/` - Redirect page (goes to dashboard if authenticated, login if not)

---

## Type Safety

All types are defined in `src/types/`:

```typescript
// User authentication
interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: number;
}

// Capsule data
type Mood = 'Happy' | 'Motivated' | 'Confused' | 'Sad' | 'Grateful' | 'Hopeful';

interface Capsule {
  id: string;
  userId: string;
  title: string;
  message: string;
  mood: Mood;
  unlockDate: number;
  photoURL?: string;
  createdAt: number;
  updatedAt: number;
  status: 'draft' | 'scheduled' | 'unlocked' | 'archived';
  isDeleted: boolean;
  isUnlocked: boolean;
}
```

Import from `types/` or `types/index.ts`:

```typescript
import { User, Capsule, Mood } from '@/types';
```

---

## Development Workflow

### Running Tests

```bash
# E2E tests (Playwright)
npm run e2e
nx run future-capsule-e2e:e2e

# Unit tests (future)
npm run test
```

### Code Quality

```bash
# Type checking
npm run typecheck

# Linting (future)
npm run lint

# Format code
npm run format
```

### Building for Production

```bash
npm run build

# Or with Nx
nx build future-capsule
```

---

## Common Tasks

### Add a New Page

1. Create file in `src/app/your-page/page.tsx`
2. Mark as client if using hooks: `'use client'`
3. Import ProtectedLayout if needed:

```typescript
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';

export default function YourPage() {
  return (
    <ProtectedLayout>
      <div>Your content</div>
    </ProtectedLayout>
  );
}
```

### Add a New Component

1. Create in `src/components/your-folder/YourComponent.tsx`
2. Mark as client if using hooks: `'use client'`
3. Use TypeScript interfaces for props:

```typescript
interface YourComponentProps {
  title: string;
  onClick?: () => void;
}

export function YourComponent({ title, onClick }: YourComponentProps) {
  return <div onClick={onClick}>{title}</div>;
}
```

### Using useAuth Hook

```typescript
'use client';

import { useAuth } from '@/hooks/useAuth';

export function MyComponent() {
  const { user, isLoading, signup, login } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  
  return <div>{user?.email}</div>;
}
```

---

## Troubleshooting

### "Firebase configuration is missing"

Ensure `.env.local` has all required `NEXT_PUBLIC_FIREBASE_*` variables.

### "useAuth must be used within an AuthProvider"

Ensure component is wrapped by `<AuthProvider>` in the layout hierarchy. Default layout includes it.

### Google Sign-In fails

1. Enable Google provider in Firebase Console
2. Add your domain to authorized JavaScript origins
3. Ensure Firebase project has proper OAuth configuration

### Types not found

All types should be imported from `@/types` or `@/types/index.ts`. Ensure TypeScript paths are configured correctly in `tsconfig.json`.

---

## Next Steps (Phase 2)

Backend integration will add:
- Capsule CRUD API routes
- Unlock date validation
- Firestore integration
- Upload image functionality
- Countdown logic

Frontend updates needed:
- CapsuleForm component implementation
- API client integration (`api-client.ts`)
- Capsule creation flow
- Dashboard implementation
- Timeline implementation

---

## References

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js 16 App Router](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [TypeScript](https://www.typescriptlang.org/docs/)

---

**Last Updated**: Phase 1 Complete  
**Status**: Frontend infrastructure ready for Phase 2
