# Supabase Migration - Complete Implementation Guide

Executive summary and quick-start reference for the Firebase → Supabase migration for FutureCapsule.

---

## **Executive Summary**

This migration modernizes FutureCapsule's backend from Firebase (Firestore + Auth) to Supabase (PostgreSQL + Auth). 

**Benefits**:
- ✅ Industry-standard PostgreSQL database
- ✅ More powerful query capabilities
- ✅ Better performance for complex operations
- ✅ Row-Level Security (RLS) for data isolation
- ✅ Open-source and self-hosted options
- ✅ Equivalent authentication capabilities

**Timeline**: 2-4 weeks (depending on data volume and testing requirements)

**Risk**: Low (Firebase can run in parallel during migration for rollback)

---

## **Deliverables Checklist**

### ✅ Documentation (All Complete)

| Document | Purpose | Location |
|----------|---------|----------|
| Supabase Setup Guide | Step-by-step project creation | [SUPABASE_SETUP_GUIDE.md](SUPABASE_SETUP_GUIDE.md) |
| Database Schema | PostgreSQL DDL scripts | [SUPABASE_DATABASE_SCHEMA.md](SUPABASE_DATABASE_SCHEMA.md) |
| RLS Policies | Security policies | [SUPABASE_RLS_POLICIES.md](SUPABASE_RLS_POLICIES.md) |
| API Routes | Next.js endpoints | [SUPABASE_API_ROUTES.md](SUPABASE_API_ROUTES.md) |
| Authentication Flow | Auth system architecture | [SUPABASE_AUTHENTICATION_FLOW.md](SUPABASE_AUTHENTICATION_FLOW.md) |
| Environment Variables | Config management | [SUPABASE_ENV_VARIABLES.md](SUPABASE_ENV_VARIABLES.md) |
| Configuration Library | Nx library structure | [SUPABASE_CONFIG_LIBRARY.md](SUPABASE_CONFIG_LIBRARY.md) |
| Migration Guide | Firebase data migration | [FIREBASE_TO_SUPABASE_MIGRATION.md](FIREBASE_TO_SUPABASE_MIGRATION.md) |
| Deployment Checklist | Production deployment | [SUPABASE_DEPLOYMENT_CHECKLIST.md](SUPABASE_DEPLOYMENT_CHECKLIST.md) |

---

## **Quick Start (30 minutes)**

### Step 1: Create Supabase Project (5 minutes)

1. Go to https://app.supabase.com
2. Click "New Project"
3. Enter project name: `future-capsule`
4. Select region closest to users
5. Save database password securely

### Step 2: Copy Credentials (2 minutes)

Go to **Settings** → **API** and copy:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`

### Step 3: Run Database Migrations (10 minutes)

1. In Supabase, go to **SQL Editor**
2. Copy each migration script from [SUPABASE_DATABASE_SCHEMA.md](SUPABASE_DATABASE_SCHEMA.md)
3. Execute them in order (001-008)

### Step 4: Enable Authentication (5 minutes)

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Enable **Google OAuth** (get credentials from Google Cloud Console)

### Step 5: Configure Environment (3 minutes)

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
```

**Done!** Now implement API routes and update frontend.

---

## **Implementation Phases**

### Phase 1: Infrastructure (Week 1)

- [ ] Create Supabase project
- [ ] Run database migrations
- [ ] Deploy RLS policies
- [ ] Configure authentication
- [ ] Set up storage bucket
- [ ] Test database connectivity

**Time**: 4-6 hours

### Phase 2: Backend API Routes (Week 1-2)

- [ ] Create Next.js API routes for capsule CRUD
- [ ] Implement user profile endpoints
- [ ] Add unlock date validation logic
- [ ] Implement proper error handling
- [ ] Add rate limiting (optional)

**Files to create**:
- `apps/future-capsule/src/app/api/user/route.ts`
- `apps/future-capsule/src/app/api/auth/signup/route.ts`
- `apps/future-capsule/src/app/api/auth/login/route.ts`
- `apps/future-capsule/src/app/api/capsules/route.ts`
- `apps/future-capsule/src/app/api/capsules/[id]/route.ts`

**Time**: 8-12 hours

### Phase 3: Configuration Library (Week 1-2)

- [ ] Create `libs/supabase-config/` with Nx structure
- [ ] Implement Supabase client initialization
- [ ] Create React hooks (useAuth, useCapsules, useUser)
- [ ] Add type definitions
- [ ] Add validation utilities

**Time**: 4-6 hours

### Phase 4: Frontend Integration (Week 2)

- [ ] Update authentication components to use Supabase
- [ ] Update capsule CRUD components
- [ ] Update hooks to use new API routes
- [ ] Test all features
- [ ] Handle error cases

**Time**: 8-12 hours

### Phase 5: Data Migration (Week 2-3)

- [ ] Export Firebase data
- [ ] Transform data for PostgreSQL
- [ ] Import to Supabase
- [ ] Verify data integrity
- [ ] Set up user credentials

**Time**: 4-8 hours

### Phase 6: Testing & QA (Week 3)

- [ ] Unit tests for API routes
- [ ] Integration tests for auth flow
- [ ] End-to-end tests with Playwright
- [ ] Performance testing
- [ ] Security testing

**Time**: 8-12 hours

### Phase 7: Staging & Production (Week 4)

- [ ] Deploy to staging environment
- [ ] Full UAT testing
- [ ] Fix any issues
- [ ] Deploy to production
- [ ] Monitor for issues

**Time**: 8+ hours

---

## **Architecture Diagram**

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
│ - React Pages   │
│ - Components    │
└────────┬────────┘
         │
         ↓ HTTP (HTTPS)
┌──────────────────────────────────────────┐
│      Next.js API Routes                  │
├──────────────────────────────────────────┤
│ /api/user              (GET, PUT)        │
│ /api/auth/signup       (POST)            │
│ /api/auth/login        (POST)            │
│ /api/capsules          (GET, POST)       │
│ /api/capsules/[id]     (GET, PUT, DEL)   │
└────────┬──────────────────────────────────┘
         │
         ↓ HTTPS (Secured)
┌──────────────────────────────────────────┐
│        Supabase Client SDK                │
│   (@supabase/supabase-js)                │
├──────────────────────────────────────────┤
│ - JWT Token Management                   │
│ - RLS Query Execution                    │
│ - Session Handling                       │
└────────┬──────────────────────────────────┘
         │
         ↓ PostgreSQL Wire Protocol
┌──────────────────────────────────────────┐
│      PostgreSQL (Supabase)                │
├──────────────────────────────────────────┤
│ Tables:                                  │
│ - auth.users (managed by Supabase Auth) │
│ - public.users (custom profiles)         │
│ - public.capsules (time capsules)        │
│ - public.mood_stats (analytics)          │
│                                          │
│ RLS: WHERE user_id = auth.uid()          │
└──────────────────────────────────────────┘
```

---

## **Tech Stack**

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 14+ (React) |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (Email + Google OAuth) |
| Storage | Supabase Storage |
| Type Safety | TypeScript |
| State Mgmt | React hooks + Context |
| Testing | Jest + Playwright |
| Deployment | Vercel |

---

## **File Structure After Migration**

```
apps/future-capsule/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── user/route.ts              ← NEW
│   │   │   ├── auth/
│   │   │   │   ├── signup/route.ts        ← NEW
│   │   │   │   └── login/route.ts         ← NEW
│   │   │   └── capsules/
│   │   │       ├── route.ts               ← NEW
│   │   │       └── [id]/route.ts          ← NEW
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── auth/                          ← UPDATE for Supabase
│   │   ├── capsule/
│   │   ├── insights/
│   │   └── layout/
│   ├── contexts/
│   │   └── AuthContext.tsx                ← Can be simplified
│   ├── hooks/
│   │   ├── useAuth.ts                     ← DELETE (use lib)
│   │   ├── useCapsules.ts                 ← DELETE (use lib)
│   │   └── useCountdown.ts
│   ├── lib/
│   │   ├── firebase.ts                    ← DELETE
│   │   ├── firestore-helpers.ts           ← DELETE
│   │   └── api-client.ts                  ← UPDATE
│   └── types/
│       ├── capsule.ts                     ← UPDATE
│       └── user.ts                        ← UPDATE
│
libs/
├── firebase/                              ← Can archive
│   ├── firestore-schema.md
│   └── firestore.rules
│
└── supabase-config/                       ← NEW
    ├── src/
    │   ├── index.ts
    │   ├── client.ts
    │   ├── types.ts
    │   ├── hooks/
    │   │   ├── useAuth.ts
    │   │   ├── useCapsules.ts
    │   │   └── useUser.ts
    │   └── utils/
    │       └── validation.ts
    └── project.json
```

---

## **Key Implementation Details**

### 1. Unlock Date Validation

**Location**: `apps/future-capsule/src/app/api/capsules/[id]/route.ts`

```typescript
// Example: Server-side unlock validation
const now = new Date();
const unlockDate = new Date(capsule.unlock_date);
const isUnlocked = now >= unlockDate;

if (!isUnlocked) {
  return Response.json({
    ...capsule,
    message: undefined, // Hide message
    isUnlocked: false,
    daysUntilUnlock: Math.ceil((unlockDate - now) / (1000*60*60*24))
  });
}
```

### 2. RLS Policy Example

**Location**: `SUPABASE_RLS_POLICIES.md`

```sql
-- Users can only see their own capsules
CREATE POLICY "capsules_can_view_own"
  ON public.capsules
  FOR SELECT
  USING (auth.uid() = user_id);
```

### 3. React Hook Example

**Location**: `libs/supabase-config/src/hooks/useCapsules.ts`

```typescript
const { capsules, fetchCapsules, createCapsule } = useCapsules();

// In component
useEffect(() => {
  fetchCapsules();
}, []);
```

---

## **Common Decisions & Trade-offs**

### Decision: Direct Supabase Client vs API Routes

**Chosen**: API Routes for production

**Reasoning**:
- ✅ Backend validation of unlock dates
- ✅ Service role key available (RLS bypass if needed)
- ✅ Rate limiting possible
- ✅ Better error handling
- ✅ Audit logging capabilty

### Decision: RLS for Access Control

**Chosen**: Yes, RLS policies required

```sql
-- Every query is filtered by RLS
-- Example: SELECT * FROM capsules
-- Becomes internally: SELECT * FROM capsules WHERE user_id = auth.uid()
```

### Decision: Email Notifications

**Status**: Optional

If enabled:
1. Set up Supabase email service (free 1,000/month)
2. Or use external service (SendGrid, Resend, etc.)
3. Create scheduled job to check unlock dates
4. Send notification emails

### Decision: Photo Storage

**Chosen**: Supabase Storage (private bucket with RLS)

```typescript
// Upload photo
const { data, error } = await supabase.storage
  .from('capsule-photos')
  .upload(`${userId}/${capsuleId}/photo.jpg`, file);
```

---

## **Performance Expectations**

| Metric | Target | Notes |
|--------|--------|-------|
| API Response Time | < 500ms | Including database query |
| Page Load Time | < 3s | Over 4G network |
| Database Query | < 200ms | With proper indexes |
| Authentication | < 1s | Including JWT generation |
| File Upload | < 5s | For 5MB file |

---

## **Security Checklist**

- ✅ All data access filtered by RLS
- ✅ No hardcoded credentials
- ✅ JWT tokens verified on backend
- ✅ HTTP-only cookies for session storage
- ✅ Input validation on all API routes
- ✅ HTTPS for all communication
- ✅ Password hashing by Supabase Auth
- ✅ Rate limiting recommended
- ✅ CORS configured properly
- ✅ SQL injection prevention (parameterized queries)

---

## **Monitoring & Observability**

### Key Metrics to Track

```typescript
// Using middleware
export function middleware(request: NextRequest) {
  const start = performance.now();
  
  // ... handle request
  
  const duration = performance.now() - start;
  console.log(`[${request.method}] ${request.nextUrl.pathname} ${duration}ms`);
}
```

### Queries to Monitor Database Health

```sql
-- Slow queries
SELECT query, mean_exec_time FROM pg_stat_statements
WHERE mean_exec_time > 500 ORDER BY mean_exec_time DESC;

-- Table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename))
FROM pg_tables WHERE schemaname = 'public';

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes ORDER BY idx_scan DESC;
```

---

## **Rollback Strategy**

If issues occur during migration:

1. **Keep Firebase running** for 7-14 days after cutover
2. **Dual-write pattern** if needed
3. **Feature flags** to switch between backends
4. **Database backups** before major changes
5. **Staging environment** matching production

---

## **Success Metrics**

✅ Migration is successful when:

- [ ] Supabase project created and configured
- [ ] All database migrations applied
- [ ] RLS policies enforced on all tables
- [ ] Email + Google OAuth working
- [ ] All API routes tested
- [ ] Unlock date validation server-side
- [ ] All tests passing
- [ ] Staging deployment successful
- [ ] Production deployment successful
- [ ] Zero data loss
- [ ] < 0.1% error rate
- [ ] Average API response < 500ms
- [ ] All users can access their data

---

## **Support & Resources**

### Documentation

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Next.js**: https://nextjs.org/docs
- **TypeScript**: https://www.typescriptlang.org/docs/

### Community

- **Supabase Discord**: https://discord.supabase.io
- **GitHub Issues**: Report migration issues
- **Stack Overflow**: Tag `supabase`

### Official Guides

- **Supabase Auth Guide**: https://supabase.com/docs/guides/auth
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **Migration Guide**: https://supabase.com/docs/guides/migrations

---

## **Next Steps**

1. **Read Full Documentation**: Start with [SUPABASE_SETUP_GUIDE.md](SUPABASE_SETUP_GUIDE.md)
2. **Create Test Project**: Set up Supabase in development environment
3. **Run Migrations**: Execute database schema scripts
4. **Implement API Routes**: Copy code from [SUPABASE_API_ROUTES.md](SUPABASE_API_ROUTES.md)
5. **Update Frontend**: Use hooks from [SUPABASE_CONFIG_LIBRARY.md](SUPABASE_CONFIG_LIBRARY.md)
6. **Test Thoroughly**: Follow [SUPABASE_DEPLOYMENT_CHECKLIST.md](SUPABASE_DEPLOYMENT_CHECKLIST.md)
7. **Deploy to Production**: Use deployment guide

---

## **FAQ**

### Q: Can we run Firebase and Supabase in parallel?

**A**: Yes! Use feature flags to gradually migrate.

```env
NEXT_PUBLIC_USE_SUPABASE=false  # Start with false
NEXT_PUBLIC_USE_SUPABASE=true   # Gradually change to true
```

### Q: How do we transfer existing user accounts?

**A**: See [FIREBASE_TO_SUPABASE_MIGRATION.md](FIREBASE_TO_SUPABASE_MIGRATION.md) - Option A: invite users to reset password, Option B: dual authentication during transition.

### Q: What about existing photos in Firebase Storage?

**A**: See migration guide - download from Firebase and re-upload to Supabase Storage.

### Q: Is RLS mandatory?

**A**: Yes, RLS is security layer. Always enable it to prevent data leaks.

### Q: Can we use REST API instead of client library?

**A**: Yes, Supabase provides REST API. But client library is simpler and handles authentication automatically.

### Q: How do we monitor performance?

**A**: Use Supabase logs, Vercel analytics, and PostgreSQL `pg_stat_statements`.

---

## **Estimated Timeline**

| Phase | Duration | Start Date | End Date |
|-------|----------|------------|----------|
| Planning & Design | 3 days | - | - |
| Infrastructure Setup | 1 week | Week 1 | Week 1 |
| Backend Development | 1.5 weeks | Week 1 | Week 2 |
| Data Migration | 1 week | Week 2 | Week 3 |
| Testing & QA | 1.5 weeks | Week 2 | Week 3 |
| Staging & UAT | 1 week | Week 3 | Week 4 |
| Production Deployment | 2 days | Week 4 | Week 4 |
| **Total** | **4 weeks** | — | — |

---

**Migration Owner**: Backend Team  
**Document Version**: 1.0  
**Last Updated**: March 2026  
**Status**: Ready for Implementation ✅
