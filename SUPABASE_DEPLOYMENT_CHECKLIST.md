# Supabase Deployment Checklist - FutureCapsule

Complete checklist for deploying FutureCapsule with Supabase to production.

---

## **Pre-Deployment Phase (1-2 weeks before)**

### Database & Schema

- [ ] Create production Supabase project
- [ ] Run all database migrations (001-008)
- [ ] Verify schema matches PostgreSQL documentation
- [ ] Create all indexes for performance
- [ ] Test database backup/restore procedure
- [ ] Load test with 1000+ capsules to verify performance
- [ ] Run `ANALYZE` to gather table statistics

```sql
-- Test query performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM public.capsules WHERE user_id = 'uuid'::uuid;
```

### Authentication

- [ ] Enable Email/Password authentication in Supabase
- [ ] Enable Google OAuth (get Client ID/Secret from Google Cloud Console)
- [ ] Configure email templates (welcome, reset, etc.)
- [ ] Verify JWT secret is set
- [ ] Test signup flow end-to-end
- [ ] Test login flow end-to-end
- [ ] Test Google OAuth flow
- [ ] Test password reset flow
- [ ] Configure email domain (custom domain recommended)

### Storage

- [ ] Create `capsule-photos` bucket
- [ ] Configure bucket policies (RLS for upload/download)
- [ ] Test file upload (5MB limit)
- [ ] Test file download/access
- [ ] Verify mime type restrictions (jpg, png, webp)
- [ ] Set up backup policy

### Environment Variables

- [ ] Create `.env.production` with production keys
- [ ] Add secrets to Vercel dashboard
- [ ] Verify all `NEXT_PUBLIC_*` variables are set
- [ ] Verify all private variables are set (SUPABASE_SERVICE_ROLE_KEY, etc.)
- [ ] Pre-tested variables in staging environment
- [ ] Document variable rotation schedule

### Code Quality

- [ ] Run TypeScript compiler: `npm run type-check`
- [ ] Run linter: `npm run lint`
- [ ] Run all tests: `npm run test`
- [ ] Run integration tests: `npm run test:integration`
- [ ] 100% code coverage for critical paths
- [ ] No console.log or debug code in production

```bash
npm run type-check && npm run lint && npm run test
```

### API Routes

- [ ] Test GET /api/user
- [ ] Test PUT /api/user
- [ ] Test POST /api/capsules (create)
- [ ] Test GET /api/capsules (list)
- [ ] Test GET /api/capsules/[id] (get single, locked/unlocked)
- [ ] Test PUT /api/capsules/[id] (update)
- [ ] Test DELETE /api/capsules/[id] (delete)
- [ ] Test rate limiting (if implemented)
- [ ] Load test with concurrent requests

### Security

- [ ] Review RLS policies in production database
- [ ] Enable database encryption at rest (Supabase default)
- [ ] Enable SSL/TLS for all connections (Supabase default)
- [ ] No hardcoded secrets in code
- [ ] No plaintext passwords in logs
- [ ] Security headers configured (CSP, X-Frame-Options, etc.)
- [ ] CORS properly configured
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] CSRF tokens on forms (if applicable)

---

## **Staging Deployment (1 week before)**

### Environment Setup

- [ ] Create staging Supabase project
- [ ] Deploy to Vercel staging environment
- [ ] Configure environment variables in staging
- [ ] Set up staging domain (staging.yourdomain.com)
- [ ] Enable Google OAuth for staging domain

### Testing in Staging

- [ ] Full user signup flow
- [ ] Full user login flow
- [ ] Create capsule with photo
- [ ] List all capsules
- [ ] View locked capsule (countdown)
- [ ] View unlocked capsule (full message) - use test capsule with past unlock date
- [ ] Edit capsule (before unlock)
- [ ] Delete capsule
- [ ] Update user profile
- [ ] Email notifications (if enabled)
- [ ] Mood statistics aggregation

### Performance Testing

- [ ] Database query performance (< 200ms)
- [ ] API response time (< 500ms)
- [ ] Page load time (< 3s on 4G)
- [ ] Static assets cache headers configured
- [ ] CDN working for image delivery
- [ ] Gzip compression enabled

```bash
# Test with Apache Bench
ab -n 100 -c 10 https://staging.yourdomain.com/api/capsules
```

### Monitoring Setup

- [ ] Enable Supabase logs
- [ ] Set up Vercel monitoring/analytics
- [ ] Configure error tracking (e.g., Sentry)
- [ ] Configure APM (Application Performance Monitoring)
- [ ] Set up alerts for errors/downtime
- [ ] Monitor database queries (slow query log)

```sql
-- Check slow queries
SELECT query, mean_exec_time FROM pg_stat_statements
ORDER BY mean_exec_time DESC LIMIT 10;
```

### Backup & Disaster Recovery

- [ ] Test database backup
- [ ] Test database restore from backup
- [ ] Verify backup retention policy (30 days minimum)
- [ ] Document recovery procedures
- [ ] Calculate RTO/RPO targets

```bash
# Backup Supabase database
supabase db pull --project-id staging-project > backup-staging.sql

# Verify backup integrity
wc -l backup-staging.sql
```

---

## **Production Deployment Day**

### Pre-Launch (Do This First)

- [ ] Final code review by at least 2 developers
- [ ] All tests passing: `npm test`
- [ ] No console errors or warnings
- [ ] Announce maintenance window (if zero-downtime not possible)
- [ ] Ensure team is available for 4+ hours after launch
- [ ] Have rollback plan ready
- [ ] Backup all data before starting

### Database Migration

- [ ] Run migrations on production database (in order)
  - [ ] 001: users table
  - [ ] 002: capsules table
  - [ ] 003: mood_stats table
  - [ ] 004: audit_log table (optional)
  - [ ] 005: user profile trigger
  - [ ] 006: updated_at triggers
  - [ ] 007: mood stats aggregation (optional)
  - [ ] 008: search index (optional)

```sql
-- Verify schema was created
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

- [ ] Verify all tables exist
- [ ] Verify all indexes created
- [ ] Verify triggers created
- [ ] Verify RLS is enabled on all tables

### RLS Policies

- [ ] Deploy all RLS policies
- [ ] Verify no policies are missing
- [ ] Test policies with different users

```sql
-- Verify RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies
WHERE schemaname = 'public' ORDER BY tablename;
```

### Environment Variables

- [ ] Deploy to Vercel production
- [ ] Add all environment variables to Vercel dashboard
- [ ] Verify variables are set correctly: go to Deployment → Runtime Environment Variables

### Health Checks

- [ ] Health check endpoint returns 200 OK
- [ ] Database connection successful
- [ ] Storage bucket accessible
- [ ] Email service ready

```bash
# Quick health check
curl -v https://yourdomain.com/api/health
# Expected: 200 OK
```

### Smoke Tests (First 30 minutes)

Run these manually in production:

1. **User Signup**
   - [ ] Create new account
   - [ ] Verify email sent
   - [ ] Login with new account
   - [ ] Check user profile created

2. **Capsule Creation**
   - [ ] Create new capsule
   - [ ] Upload photo
   - [ ] Verify capsule appears in list

3. **Capsule Viewing**
   - [ ] View locked capsule (no message)
   - [ ] View unlocked test capsule (with message)
   - [ ] Run countdown timer

4. **API Endpoints**
   - [ ] GET /api/user (returns authenticated user)
   - [ ] GET /api/capsules (returns list)
   - [ ] POST /api/capsules (create new)

```bash
# Test API
TOKEN=$(curl -X POST https://yourdomain.com/api/auth/login \
  -d '{"email":"test@example.com","password":"password"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

curl -H "Authorization: Bearer $TOKEN" https://yourdomain.com/api/capsules
```

### Monitoring

- [ ] Error rate < 0.1%
- [ ] Response time average < 500ms
- [ ] Database performance healthy
- [ ] No spike in resource usage
- [ ] All API endpoints responding

### Announcement

- [ ] Post update on status page
- [ ] Notify users (email/in-app)
- [ ] Update documentation
- [ ] Share announcement on social media

---

## **Post-Deployment Phase (24-48 hours after)**

### Production Validation

- [ ] Monitor error logs for issues
- [ ] Monitor performance metrics
- [ ] Monitor database usage
- [ ] Monitor storage usage
- [ ] Respond to user reports immediately

### Analytics

- [ ] Track signup/login rates
- [ ] Track capsule creation rate
- [ ] Track page load performance
- [ ] Track API endpoint usage

### User Feedback

- [ ] Gather feedback from early users
- [ ] Fix any critical bugs
- [ ] Monitor community channels (Discord, Reddit, etc.)

### Documentation

- [ ] Update deployment documentation
- [ ] Document any issues encountered
- [ ] Document resolution steps
- [ ] Share learnings with team

---

## **Ongoing Maintenance**

### Weekly

- [ ] Review error logs
- [ ] Check database performance
- [ ] Verify backups completed
- [ ] Monitor uptime (99.9% target)

### Monthly

- [ ] Security audit (check for exposed keys)
- [ ] Performance review (query optimization)
- [ ] Capacity planning (storage, database size)
- [ ] Dependency updates (check for CVEs)

### Quarterly

- [ ] Rotate authentication keys
- [ ] Update RLS policies if needed
- [ ] Load test for capacity
- [ ] Disaster recovery drill

---

## **Rollback Plan**

If critical issues occur:

### Immediate Actions (Minutes 0-15)

1. **Assess Severity**
   - Is data affected?
   - Are users blocked?
   - Can we fix forward instead of rolling back?

2. **If Rolling Back**
   - Revert Vercel deployment to previous version
   - Revert environment variables
   - Restart Next.js application

```bash
# Revert Vercel to previous deployment
# Go to Vercel Dashboard → Deployments → Select previous → Click "Promote to Production"
```

3. **Notify Users**
   - Post status update
   - Estimate time to fix

### Short-Term (15 minutes - 2 hours)

1. **Root Cause Analysis**
   - What went wrong?
   - Where is the issue?
   - Is it code or infrastructure?

2. **Fix Preparation**
   - Fix bug in development
   - Test fix thoroughly
   - Prepare for re-deployment

3. **Re-deployment**
   - Deploy fix to staging first
   - Verify fix works
   - Deploy to production
   - Run smoke tests

### Follow-Up (2-24 hours)

1. **Post-Incident Review**
   - What was the root cause?
   - How can we prevent this?
   - What monitoring should we add?

2. **Implement Fixes**
   - Add test to prevent regression
   - Improve monitoring/alerting
   - Update documentation

---

## **Monitoring & Alerting**

### Critical Alerts (Notify immediately)

- [ ] Database connection fails
- [ ] API error rate > 5%
- [ ] API response time > 2s
- [ ] Storage quota exceeded
- [ ] Authentication failures > 100/hour

### Warning Alerts (Check within 1 hour)

- [ ] Error rate > 1%
- [ ] Response time > 1s
- [ ] Database CPU > 80%
- [ ] Storage usage > 80%

### Informational (Check daily)

- [ ] Slow queries (> 500ms)
- [ ] Database size growth
- [ ] User signup trends

---

## **Key Metrics to Monitor**

```
┌─────────────────────────────────────────────┐
│            Production Dashboard             │
├─────────────────────────────────────────────┤
│                                             │
│  Uptime: 99.97%                            │
│  Response Time: 145ms (avg)                │
│  Error Rate: 0.08%                         │
│  Active Users: 1,240                       │
│  Database Size: 2.3 GB                     │
│  Storage Usage: 15.6 GB                    │
│                                             │
└─────────────────────────────────────────────┘
```

### Queries to check health

```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('postgres'));

-- Row counts
SELECT 'users' as table_name, COUNT(*) FROM public.users
UNION ALL
SELECT 'capsules', COUNT(*) FROM public.capsules
UNION ALL
SELECT 'mood_stats', COUNT(*) FROM public.mood_stats;

-- Slow queries
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 500
ORDER BY mean_exec_time DESC;
```

---

## **References**

- **Vercel Deployment**: https://vercel.com/docs/deployments
- **Supabase Production Ready**: https://supabase.com/docs/guides/platform/going-into-prod
- **PostgreSQL Optimization**: https://www.postgresql.org/docs/current/performance-tips.html
- **Error Tracking**: https://docs.sentry.io/product/performance/
