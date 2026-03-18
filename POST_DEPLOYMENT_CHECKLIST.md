# FutureCapsule Post-Deployment Validation Checklist

**Deployment Date**: [To be filled when deployed]  
**Live URL**: `https://[your-app].vercel.app`  
**Environment**: PRODUCTION  
**Status**: ⚠️ PENDING (pre-deployment document)

---

## PRE-DEPLOYMENT VERIFICATION (Complete before pushing to Vercel)

### Local Build Test
- [ ] Run: `npm run build` completes without errors
- [ ] Run: `npm start` starts successfully
- [ ] Access: http://localhost:3000 loads without errors
- [ ] Check console (F12 → Console): No red errors
- [ ] Check console: No warnings related to Firebase or auth

### Environment Configuration
- [ ] `.env.local` exists in workspace root
- [ ] `.env.local` has correct development Firebase credentials
- [ ] `NEXT_PUBLIC_ENVIRONMENT=development` in `.env.local`
- [ ] `NEXT_PUBLIC_USE_EMULATOR=true` in `.env.local` (if using emulator)
- [ ] `.env.example` is committed (acts as template)
- [ ] `.env.local` is in `.gitignore` (not committed)

### Code Quality
- [ ] All tests passing: `npm test` shows ✅
- [ ] Test coverage >= 82%
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] No linting errors: `npx eslint src/`
- [ ] Build completes: `npm run build` succeeds

### Firebase Production Project
- [ ] Firebase production project created (separate from dev)
- [ ] Firestore database created in production project
- [ ] Authentication providers enabled:
  - [ ] Email/Password enabled
  - [ ] Google Sign-In enabled
- [ ] Security rules deployed: `firebase deploy --only firestore:rules`
- [ ] Firebase credentials copied and safe (not in code)

### GitHub & Vercel Setup
- [ ] GitHub repository created and code pushed
- [ ] Vercel account created (https://vercel.com)
- [ ] Vercel connected to GitHub repository
- [ ] Project imported into Vercel

### Vercel Project Configuration
- [ ] Framework detected as "Next.js"
- [ ] Root Directory set to: `apps/future-capsule`
- [ ] Build Command set to: `npx nx build future-capsule`
- [ ] Output Directory set to: `.next`
- [ ] Install Command set to: `npm ci`
- [ ] Node.js version >= 18

### Environment Variables in Vercel Dashboard
Add to **PRODUCTION** environment:
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `NEXT_PUBLIC_ENVIRONMENT=production`
- [ ] `NEXT_PUBLIC_USE_EMULATOR=false`

---

## DEPLOYMENT EXECUTION

### Vercel Deployment
- [ ] Clicked "Deploy" button in Vercel Dashboard
- [ ] Observed build starting in Vercel Dashboard
- [ ] Vercel provided public URL: `https://[project-name].vercel.app`
- [ ] Build completed successfully (green checkmark)
- [ ] Deployment status: "Ready" ✅

**Build Time**: _____ minutes (typically 5-15 min)  
**Status**: ✅ COMPLETED or ⚠️ FAILED

If failed:
- [ ] Checked build logs in Vercel Dashboard
- [ ] Verified all environment variables are set
- [ ] Fixed issue and redeployed

---

## LIVE URL VALIDATION

### Access & Load Testing

**Public URL**: `https://_______________`

- [ ] URL is publicly accessible (no localhost)
- [ ] Page loads without errors (network tab all green)
- [ ] No 404 errors in console
- [ ] No certificate warnings (HTTPS secure)
- [ ] Page load time < 3 seconds (measured)

### Browser Console Check

Open browser DevTools (F12) → Console tab:
- [ ] No red error messages ❌
- [ ] No "Failed to fetch" errors
- [ ] No Firebase initialization errors
- [ ] No auth-related errors
- [ ] No undefined variable warnings
- [ ] Network tab shows successful requests (200, 304 status)

### Responsive Design
- [ ] Desktop view (1920x1080) looks correct
- [ ] Tablet view (768px) responsive
- [ ] Mobile view (375px) responsive
- [ ] No horizontal scroll on mobile
- [ ] Touch interactions work on mobile
- [ ] Navigation menu responsive

---

## AUTHENTICATION & USER FLOW

### Sign Up Process
1. [ ] Navigate to `/signup`
2. [ ] Page loads correctly
3. [ ] Fill email field with test email: `test@futurecapsule.app`
4. [ ] Fill password field: `TestPass123!`
5. [ ] Click "Create Account"
6. [ ] Page redirects to `/dashboard` (success) ✅
7. [ ] New user created in Firebase Firestore
8. [ ] Console shows successful auth: "User signed up successfully"

### Google Sign-In (Optional)
1. [ ] Click "Sign up with Google"
2. [ ] Google login popup appears
3. [ ] Sign in with test Google account
4. [ ] Redirect back to app
5. [ ] User created in Firestore
6. [ ] Logged in successfully ✅

### Login Process
1. [ ] Navigate to `/login`
2. [ ] Enter email: `test@futurecapsule.app`
3. [ ] Enter password: `TestPass123!`
4. [ ] Click "Log In"
5. [ ] Redirect to `/dashboard` ✅
6. [ ] Console shows: "User logged in successfully"

### Session Persistence
1. [ ] Refresh page (F5)
2. [ ] User remains logged in (session persisted)
3. [ ] Cookies visible in DevTools (Application → Cookies)
4. [ ] Close browser and reopen
5. [ ] User still logged in (session restored) ✅

### Logout
1. [ ] Click logout/settings menu
2. [ ] Click "Log Out" button
3. [ ] Redirect to `/login` page
4. [ ] Session cleared
5. [ ] Cannot access protected pages without login ✅

---

## CORE FEATURE VALIDATION

### Capsule Creation
1. [ ] Navigate to `/create`
2. [ ] Fill in capsule message field
3. [ ] Select mood (emoji picker works)
4. [ ] Select unlock date (future date picker works)
5. [ ] Click "Create Capsule"
6. [ ] Success notification appears
7. [ ] Redirect to dashboard
8. [ ] New capsule visible on timeline ✅

### View Capsule
1. [ ] Capsule appears on timeline with:
   - [ ] Message preview
   - [ ] Mood emoji
   - [ ] Unlock date
   - [ ] Countdown timer
2. [ ] Click capsule to view details
3. [ ] If locked: Shows countdown timer and message preview
4. [ ] If unlocked: Shows full message content
5. [ ] Close modal returns to timeline ✅

### Countdown Timer
1. [ ] Countdown displays on capsule card
2. [ ] Format: "X days, X hours remaining" or "Unlocked"
3. [ ] Timer updates in real-time (wait 10-15 seconds, verify change)
4. [ ] Timer reaches 00:00:00 and shows "Unlocked" status ✅
5. [ ] Unlocked message is readable

### Dashboard Overview
1. [ ] Navigate to `/dashboard`
2. [ ] Displays summary statistics:
   - [ ] Total capsules created
   - [ ] Capsules locked (remaining)
   - [ ] Capsules unlocked
   - [ ] Next unlock date
3. [ ] Timeline shows all capsules
4. [ ] Capsules sorted by unlock date (nearest first)
5. [ ] Filters work (All, Locked, Unlocked) ✅

### Insights & Mood Dashboard
1. [ ] Navigate to `/insights`
2. [ ] Mood cards display:
   - [ ] Mood emoji
   - [ ] Count of capsules with that mood
   - [ ] Visual card styling
3. [ ] Mood trends chart displays
4. [ ] Statistics calculated correctly
5. [ ] No calculation errors in console ✅

### Edit Capsule (if implemented)
1. [ ] Open capsule details
2. [ ] Click "Edit" button
3. [ ] Form pre-fills with current values
4. [ ] Edit message, mood, or unlock date
5. [ ] Click "Save"
6. [ ] Changes persisted in Firestore
7. [ ] Dashboard updates ✅

### Delete Capsule (if implemented)
1. [ ] Open capsule details
2. [ ] Click "Delete" button
3. [ ] Confirmation dialog appears
4. [ ] Confirm deletion
5. [ ] Capsule removed from timeline
6. [ ] Database updated ✅

---

## PERFORMANCE VALIDATION

### Page Load Speed
Measure in DevTools (F12 → Network tab):

| Page | Target | Measured | Status |
|------|--------|----------|--------|
| / (Home/Login) | < 2.0s | _____ | ⚠️ |
| /dashboard | < 2.5s | _____ | ⚠️ |
| /create | < 2.0s | _____ | ⚠️ |
| /insights | < 3.0s | _____ | ⚠️ |

**Notes**: 
- Measured from first byte to full page load
- First visit may be slower (cold Firebase connection)
- Subsequent visits may be cached

### Core Web Vitals
Check in Vercel Analytics or DevTools (Lighthouse):

- [ ] LCP (Largest Contentful Paint): < 2.5s ✅
- [ ] FID (First Input Delay): < 100ms ✅
- [ ] CLS (Cumulative Layout Shift): < 0.1 ✅

### Bundle Size
DevTools → Network tab, filter by JS files:

- [ ] Main bundle: < 100KB (gzipped)
- [ ] Firebase chunk: < 250KB (lazy loaded)
- [ ] Total initial script load: < 300KB

### API Response Times
Open DevTools → Network tab, perform actions:

- [ ] Create capsule: API response < 2s ✅
- [ ] Fetch dashboard: API response < 2s ✅
- [ ] Fetch insights: API response < 3s ✅

---

## DATA PERSISTENCE & INTEGRITY

### Firebase Firestore Connection
- [ ] Data written to Firestore (check in Firebase Console)
- [ ] Data persists across sessions
- [ ] Data visible across different devices (with same account)
- [ ] No data loss on page refresh

### User Data Isolation
1. [ ] Create second test account: `test2@futurecapsule.app`
2. [ ] Log in as test2
3. [ ] Dashboard shows ONLY test2's capsules
4. [ ] Cannot see test1's capsules
5. [ ] Security validated ✅

### Data Format Validation
Check Firestore Console:

- [ ] User document has correct structure
- [ ] Capsule document has: id, userId, message, mood, unlockedDate, createdAt
- [ ] Timestamps are correct format
- [ ] No extra/missing fields

---

## SECURITY VALIDATION

### HTTPS & Certificates
- [ ] URL starts with `https://` (not `http://`)
- [ ] Green lock icon in browser address bar
- [ ] No certificate warnings
- [ ] All resources loaded over HTTPS

### Security Headers
Open DevTools → Network → click any request → Headers tab:

- [ ] `Content-Security-Policy` present
- [ ] `X-Frame-Options: DENY` present
- [ ] `X-Content-Type-Options: nosniff` present
- [ ] `Strict-Transport-Security` present

### Authentication Security
- [ ] Passwords stored securely (Firebase auth)
- [ ] Session tokens in secure cookies
- [ ] Logout clears session completely
- [ ] Cannot access protected pages without login
- [ ] Cannot forge session tokens

### Data Privacy
- [ ] No sensitive data in console logs
- [ ] No passwords logged
- [ ] No API keys exposed in client code
- [ ] Firebase rules restrict unauthorized access

---

## ERROR HANDLING & RECOVERY

### Network Error Handling
1. [ ] Open DevTools → Network tab
2. [ ] Throttle to "Slow 3G" (DevTools → Throttling)
3. [ ] Try creating capsule
4. [ ] Error message displays gracefully
5. [ ] Can retry operation
6. [ ] No crash or blank page

### Firebase Connection Loss
1. [ ] Turn off WiFi/internet
2. [ ] Try accessing app
3. [ ] Error message shows: "Connection lost"
4. [ ] Reconnect internet
5. [ ] App recovers automatically ✅

### Invalid Form Input
1. [ ] Try sign up with invalid email (no @ symbol)
2. [ ] Error message appears: "Invalid email"
3. [ ] Try password < 8 characters
4. [ ] Error message appears: "Password too short"
5. [ ] Try submit without filling required fields
6. [ ] Validation prevents submission ✅

### Expired Session (if applicable)
1. [ ] Login and keep browser open > 60 minutes
2. [ ] Try to create a capsule
3. [ ] Either: (a) Prompt to re-login, or (b) Auto-refresh session
4. [ ] Handle gracefully without data loss ✅

---

## BROWSER COMPATIBILITY TESTING

Test in multiple browsers (sample):

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ |
| Firefox | Latest | ✅ |
| Safari | Latest | ✅ |
| Edge | Latest | ✅ |
| Mobile Safari | iOS 15+ | ✅ |
| Chrome Mobile | Android 10+ | ✅ |

Check:
- [ ] All pages render correctly
- [ ] All interactive features work
- [ ] Console shows no browser-specific errors
- [ ] No layout issues

---

## EMAIL & NOTIFICATIONS (if configured)

- [ ] Verification email received after signup
- [ ] Email link is valid and works
- [ ] Password reset email functional
- [ ] Notification emails sent for capsule unlocks

---

## MONITORING & ANALYTICS SETUP

### Vercel Analytics
- [ ] Analytics enabled in Vercel Dashboard
- [ ] Web Vitals visible in analytics
- [ ] Performance metrics displaying correctly

### Error Tracking (if Sentry configured)
- [ ] Sentry project created
- [ ] DSN added to environment variables
- [ ] Test error visible in Sentry Dashboard
- [ ] Error notifications working

### Logging
- [ ] Production logs available (Vercel Logs)
- [ ] No sensitive data in logs
- [ ] Error logs captured

---

## DATABASE BACKUP & RECOVERY

### Firestore Export
- [ ] Export Firestore database for backup
- [ ] Store securely
- [ ] Recovery process documented
- [ ] Can restore from backup if needed

---

## DOCUMENTATION VERIFICATION

- [ ] `DEPLOYMENT_GUIDE.md` is accurate
- [ ] `VERCEL_CONFIGURATION.md` references correct settings
- [ ] Environment variables documented
- [ ] Troubleshooting section covers common issues
- [ ] Support contact information provided

---

## SIGN-OFF & DEPLOYMENT APPROVAL

### Final Checklist Before Going Public
- [ ] All tests passing (82%+ coverage)
- [ ] All validation items checked and passing
- [ ] No critical issues or bugs found
- [ ] Performance meets targets (< 3s page load)
- [ ] Security validated
- [ ] Monitoring configured
- [ ] Rollback plan documented
- [ ] Team approval obtained

### Deployment Authorization

**Deployed By**: ___________________________

**Date**: ___________________________

**Status**: 
- [ ] ✅ LIVE - FutureCapsule deployed to production
- [ ] ⚠️ STAGING - Deployed to staging, pending final testing
- [ ] ❌ ROLLBACK - Issues found, reverted to previous version

### Sign-Off

**Team Lead**: ___________________________

**Date**: ___________________________

**Notes**: 

```
[Any issues discovered, resolutions, or notes]


```

---

## ONGOING MAINTENANCE

After deployment, monitor:

- [ ] Daily: Check Vercel Dashboard for errors
- [ ] Weekly: Review analytics and performance metrics
- [ ] Weekly: Check Firestore usage and costs
- [ ] Monthly: Review security logs
- [ ] Monthly: Update dependencies if needed

---

### Document Version
**Version**: 1.0  
**Created**: March 11, 2026  
**Last Updated**: (pending deployment)  
**Status**: PENDING ⚠️ (awaiting deployment)

---

**KEEP THIS CHECKLIST UPDATED AFTER DEPLOYMENT!**
