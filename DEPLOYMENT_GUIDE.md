# FutureCapsule Deployment Guide - Vercel

**Last Updated**: March 11, 2026  
**Status**: PRODUCTION READY
**Test Coverage**: 82%+ ✅

---

## QUICK START (10 minutes)

### Prerequisites
- GitHub account with FutureCapsule repository
- Vercel account (free tier available at https://vercel.com)
- Firebase production project (separate from development)
- Firebase credentials copied

### Express Deployment Steps

1. **Sign up for Vercel** → https://vercel.com/signup
2. **Connect GitHub** → Authorize Vercel to access your repositories
3. **Import Project**:
   - Choose "Import Git Repository"
   - Select your `futurecapsule` repo
   - Framework: Next.js
   - Root Directory: `apps/future-capsule`
   - Build Command: `npx nx build future-capsule`
   - Output Directory: `.next`
4. **Add Environment Variables** (see section below)
5. **Deploy** → Click "Deploy"
6. **Test Live URL** → Vercel provides public URL immediately

---

## DETAILED SETUP

### Step 1: Create Firebase Production Project

1. Visit Firebase Console: https://console.firebase.google.com
2. Click "Create Project" (or select existing)
3. Name: "FutureCapsule Production"
4. Enable Google Analytics
5. Wait for project creation (2-3 minutes)

**Get Production Credentials**:
- Go to Project Settings (gear icon)
- Click "Your apps" section
- Select Web app (if not created, click "Add app")
- Copy these values:
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`

### Step 2: Configure Firebase Authentication

**Enable Google Sign-In**:
1. Firebase Console → Build → Authentication
2. Click "Email/Password" → Enable → Save
3. Click "Google" → Enable
4. In "Authorized domains" add:
   - `localhost` (development)
   - `[your-app].vercel.app` (from Vercel deployment)
   - `futurecapsule.com` (if using custom domain)

**Setup Google OAuth Credentials**:
1. Google Cloud Console: https://console.cloud.google.com
2. APIs & Services → OAuth consent screen
3. Add authorized redirect URIs:
   ```
   https://[your-app].vercel.app/auth/callback
   https://localhost:3000/auth/callback (dev)
   ```

### Step 3: Deploy Firestore Rules

**From your local machine**:
```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy Firestore rules
cd libs/firebase
firebase deploy --only firestore:rules --project=futurecapsule-prod
```

Rules file location: `libs/firebase/firestore.rules`

### Step 4: Vercel Configuration

**Create Vercel Account**:
1. Visit https://vercel.com
2. Sign up with GitHub account
3. Authorize Vercel access

**Create New Project**:
1. Click "Add New..." → "Project"
2. Click "Import Git Repository"
3. Find `futurecapsule` repository
4. Click "Import"

**Configure Project Settings**:

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Root Directory | `apps/future-capsule` |
| Build Command | `npx nx build future-capsule` |
| Output Directory | `.next` |
| Install Command | `npm ci` |
| Development Command | `npm run dev` |

**Note**: Vercel auto-detects these settings, but verify they're correct.

### Step 5: Add Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables

Add for **all environments** (Preview, Staging, Production):

```
NEXT_PUBLIC_FIREBASE_API_KEY = <from Firebase Console>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = <from Firebase Console>
NEXT_PUBLIC_FIREBASE_PROJECT_ID = <from Firebase Console>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = <from Firebase Console>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = <from Firebase Console>
NEXT_PUBLIC_FIREBASE_APP_ID = <from Firebase Console>
NEXT_PUBLIC_ENVIRONMENT = production
NEXT_PUBLIC_USE_EMULATOR = false
```

**For Pull Request (Preview) Environment** (optional, use dev Firebase):
- Use separate Firebase dev project credentials
- Set `NEXT_PUBLIC_ENVIRONMENT = staging`

### Step 6: Deploy

1. Push code to GitHub (main branch)
2. Vercel automatically detects changes
3. Automatic build starts (visible in Vercel Dashboard)
4. Wait 5-15 minutes for build completion
5. Vercel assigns public URL: `https://futurecapsule-xyz.vercel.app`

---

## LOCAL BUILD VERIFICATION (Before Deployment)

**Test production build locally**:

```bash
# Install dependencies
npm install

# Build the app
npm run build

# Start production server
npm start

# Open browser - should show running app
curl http://localhost:3000
```

**Verify in browser**:
- Navigate to http://localhost:3000
- Sign up with test email
- Create a capsule
- View dashboard
- No errors in browser console (F12 → Console tab)

---

## VERCEL BUILD TROUBLESHOOTING

### Build Fails - "Module not found"

**Common Cause**: Nx build cache issue

```bash
# Clear Nx cache and rebuild
npx nx reset
npm run build
```

**Solution in Vercel**:
1. Go to Project Settings → Advanced
2. Enable "Override Output Settings"
3. Set as:
   - Build Command: `npm run build`
   - Output Directory: `apps/future-capsule/.next`

### Build Fails - "Out of memory"

**Solution**: Increase Node memory
```bash
# In vercel.json or environment
NODE_OPTIONS=--max-old-space-size=4096
```

### Environment Variables Not Loading

1. Verify in Vercel Dashboard → Settings → Environment Variables
2. Restart deployment
3. Check `.env.example` has correct variable names

### Firebase Connection Fails

1. Verify `NEXT_PUBLIC_ENVIRONMENT=production`
2. Verify `NEXT_PUBLIC_USE_EMULATOR=false`
3. Check Firebase project credentials are correct
4. Verify Firestore security rules are deployed

---

## TESTING THE LIVE APP

After successful Vercel deployment:

### Sign Up & Authentication
```
1. Visit https://[your-app].vercel.app/
2. Click "Sign Up"
3. Enter email and password
4. Click "Create Account"
5. ✅ Should be redirected to dashboard
```

### Create & Manage Capsules
```
1. Click "Create Capsule"
2. Enter message, mood, unlock date
3. Click "Create"
4. ✅ Capsule appears on timeline
5. ✅ Click capsule to view (locked until unlock date)
```

### View Dashboard
```
1. Navigate to /dashboard
2. ✅ Shows all user's capsules
3. ✅ Countdown timers updating
4. ✅ Summary stats present
```

### View Insights
```
1. Navigate to /insights
2. ✅ Mood cards showing
3. ✅ Trends visible
4. ✅ Stats calculated correctly
```

### Mobile Responsive
```
1. Open on phone or use DevTools responsive mode
2. ✅ Layout adjusts properly
3. ✅ Touch interactions work
4. ✅ No horizontal scroll
```

### No Console Errors
```
1. Open browser DevTools (F12)
2. Go to Console tab
3. ✅ No red error messages
4. ✅ No warnings about Firebase
5. ✅ Auth logs clean
```

---

## POST-DEPLOYMENT CHECKLIST

- [ ] Vercel build completed successfully
- [ ] Public URL is live and accessible
- [ ] Sign up works (creates user in Firestore)
- [ ] Login works with existing account
- [ ] Google Sign-In works
- [ ] Create capsule works
- [ ] Capsule appears on timeline
- [ ] Countdown timer updates in real-time
- [ ] View insights page works
- [ ] View mood dashboard works
- [ ] Logout works
- [ ] HTTPS enforced (no mixed content)
- [ ] No 404 errors in console
- [ ] Mobile responsive verified
- [ ] Page loads within 3 seconds
- [ ] All navigation links work
- [ ] Sign up email verification (if configured)

---

## MONITORING & MAINTENANCE

### Enable Vercel Analytics
1. Dashboard → Settings → Analytics
2. Toggle "Web Vitals" → Enabled
3. Monitor performance in dashboard

### Monitor Errors
1. Setup Sentry (optional):
   ```bash
   npm install @sentry/nextjs
   ```
2. Initialize in app layout
3. Errors automatically reported to Sentry dashboard

### Logs
View build/runtime logs:
- Vercel Dashboard → Deployments → Click deployment
- Click "Logs" tab
- See build output and runtime errors

---

## ROLLBACK & REDEPLOYMENT

### Redeploy Latest
```bash
git push origin main  # Triggers automatic deployment
```

### Rollback to Previous Version
1. Vercel Dashboard → Deployments
2. Find previous successful deployment
3. Click "..." menu → "Promote to Production"

### Manual Redeploy Same Commit
1. Vercel Dashboard → Deployments
2. Click deployment → "Redeploy"

---

## CUSTOM DOMAIN (Optional)

If using own domain (e.g., `futurecapsule.com`):

### Add Domain in Vercel
1. Project Settings → Domains
2. Add domain name
3. Follow DNS configuration steps
4. SSL certificate auto-provisioned by Let's Encrypt

### Update Firebase OAuth
1. Firebase Console → Build → Authentication
2. Authorized domains → Add `futurecapsule.com`
3. Google Cloud Console → OAuth redirect URIs
4. Add `https://futurecapsule.com/auth/callback`

### Update Email Links (if using)
- Firebase auth email links use verified domain
- Update in Email Templates (if custom configured)

---

## PERFORMANCE OPTIMIZATION

### Next.js Built-in Optimizations
- ✅ Code splitting by default
- ✅ Image optimization via next/image
- ✅ Automatic minification
- ✅ CSS optimization
- ✅ Static generation & ISR

### Current Configuration (next.config.js)
- ✅ Webpack bundle splitting
- ✅ Firebase vendor optimization
- ✅ gzip compression
- ✅ Security headers
- ✅ CSP headers

### Monitor Performance
- Vercel Dashboard → Analytics → Web Vitals
- Check:
  - **FCP** (First Contentful Paint): < 1.8s
  - **LCP** (Largest Contentful Paint): < 2.5s
  - **CLS** (Cumulative Layout Shift): < 0.1
  - **Page Load**: < 3s

---

## SECURITY CHECKLIST

- [x] HTTPS enforced
- [x] Security headers configured (CSP, X-Frame-Options, etc.)
- [x] Secure cookies (httpOnly, Secure flag)
- [x] Firestore rules restrict unauthorized access
- [x] API routes validate authentication
- [x] Environment variables secured (no secrets in code)
- [x] Firebase emulator disabled in production
- [x] CORS configured properly
- [x] Auth redirects secure

---

## TROUBLESHOOTING

### "Cannot find module" Errors

```bash
# Clear cache and rebuild
npx nx reset
npm install
npm run build
```

### Firebase Initialization Error

Check in browser console:
1. Verify `NEXT_PUBLIC_*` variables are set
2. Verify `NEXT_PUBLIC_USE_EMULATOR=false`
3. Verify Firebase project is accessible
4. Check Firestore security rules allow public read/write (development)

### Long Build Times

- First build: 10-15 minutes (normal)
- Subsequent builds: 2-5 minutes
- If consistently slow, check Vercel build logs

### Static Files Not Loading

- Verify files in `apps/future-capsule/public/`
- Check `vercel.json` routes configuration
- Clear Vercel cache: Dashboard → Settings → Git → Clear all

---

## GETTING HELP

### Vercel Documentation
- https://vercel.com/docs
- https://vercel.com/docs/nextjs

### Firebase Documentation
- https://firebase.google.com/docs
- https://firebase.google.com/docs/firestore/security

### Next.js Documentation
- https://nextjs.org/docs

---

## NEXT STEPS

1. ✅ Deploy to Vercel (this guide)
2. Domain setup (custom domain)
3. Email verification setup
4. Error monitoring (Sentry)
5. Performance monitoring
6. User onboarding campaign
7. Feedback collection
8. Continuous deployment (CI/CD)

---

**Version**: 1.0  
**Last Updated**: March 11, 2026  
**Status**: VERIFIED ✅
