# Firebase Infrastructure for FutureCapsule

Complete backend infrastructure setup for the FutureCapsule letter-to-future-self platform.

## 📚 Documentation

### Start Here
1. **[PHASE_1_COMPLETE.md](./PHASE_1_COMPLETE.md)** - Executive summary and architecture overview
2. **[api-contract.md](./api-contract.md)** - All REST API endpoints and contracts
3. **[firestore-schema.md](./firestore-schema.md)** - Database structure and design

### Detailed Guides
4. **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Step-by-step deployment (local, staging, production)
5. **[firestore-config/README.md](../firebase-config/README.md)** - Configuration library usage

### Reference
6. **[firestore.rules](./firestore.rules)** - Security rules (copy-paste ready)
7. **[.env.example](../../.env.example)** - Environment variables template

---

## 🎯 Quick Navigation

### For Frontend Developer
→ Read: api-contract.md, firestore-schema.md (first 3 sections)  
→ Setup: Copy .env.example to .env.local  
→ Code: Import from `@monorepo/firebase-config`  

### For Backend/API Developer
→ Read: api-contract.md (all endpoints), firestore.rules  
→ Implement: /api/capsules/* routes with unlock validation  
→ Deploy: `firebase deploy --only firestore:rules`  

### For DevOps/Deployment
→ Read: SETUP_GUIDE.md (all sections)  
→ Execute: Step-by-step Firebase setup  
→ Verify: Deployment checklist  

### For QA/Testing
→ Read: PHASE_1_COMPLETE.md testing checklist  
→ Reference: api-contract.md testing section  
→ Validate: Security rules against attacks  

---

## 📋 File Summary

| File | Size | Purpose |
|------|------|---------|
| PHASE_1_COMPLETE.md | ~450 lines | Overview, architecture, handoff guide |
| api-contract.md | ~800 lines | All 5 API endpoints, contracts, examples |
| firestore-schema.md | ~500 lines | Database design, collections, indexes |
| SETUP_GUIDE.md | ~600 lines | Deployment for dev/staging/production |
| firestore.rules | ~180 lines | Security rules, user isolation |

**Total**: ~2500 lines of production-grade documentation

---

## 🚀 Quick Start

### 1. Environment Setup
```bash
# Copy template
cp .env.example .env.local

# Fill in your Firebase credentials
# (Get from Firebase Console)
```

### 2. Start Emulator (Development)
```bash
firebase emulators:start
```

Expected output:
```
✔ Firestore Emulator started at http://localhost:8080
✔ Auth Emulator started at http://localhost:9099
✔ Storage Emulator started at http://localhost:4000
```

### 3. Initialize Firebase in Your App
```typescript
import { getFirebaseConfig, emulatorConfig } from '@monorepo/firebase-config';

const app = initializeApp(getFirebaseConfig());

if (emulatorConfig.enabled) {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(firestore, 'localhost', 8080);
}

export const db = getFirestore(app);
export const authentication = getAuth(app);
```

### 4. Implement API Endpoints
See [api-contract.md](./api-contract.md) for all endpoints:
- POST /api/capsules
- GET /api/capsules
- GET /api/capsules/:id (with unlock validation)
- PUT /api/capsules/:id
- DELETE /api/capsules/:id

---

## 🔒 Security Overview

**User Isolation**: Users can only access their own capsules  
**Unlock Validation**: Backend enforces `currentDate >= capsule.unlockDate`  
**Authentication**: Firebase ID tokens required for all operations  
**Soft Deletes**: Documents marked deleted, not permanently removed  

See [firestore.rules](./firestore.rules) for complete security rules.

---

## 📊 Data Structure

### Users Collection
```
/users/{uid}
├── uid: string (Firebase Auth UID)
├── email: string
├── displayName: string
├── createdAt: timestamp
├── updatedAt: timestamp
└── preferences: {...}
```

### Capsules Sub-Collection
```
/users/{uid}/capsules/{capsuleId}
├── id: string
├── userId: string
├── title: string (1-255 chars)
├── message: string (1-50000 chars)
├── mood: 'Happy' | 'Motivated' | 'Confused' | 'Sad' | 'Grateful' | 'Hopeful'
├── unlockDate: timestamp ← KEY FIELD FOR LOCKING
├── photoURL?: string (Cloud Storage)
├── createdAt: timestamp
├── updatedAt: timestamp
├── isDeleted: boolean
└── status: 'draft' | 'scheduled' | 'unlocked' | 'archived'
```

See [firestore-schema.md](./firestore-schema.md) for complete specification.

---

## 🎯 Key Endpoints

### Create Capsule
```
POST /api/capsules
{
  "title": "My Future Letter",
  "message": "...",
  "mood": "Happy",
  "unlockDate": 1679000000000
}
```

### Get User's Capsules
```
GET /api/capsules?limit=50&sortBy=unlockDate
→ Returns capsules sorted by unlock date, with locking status
```

### Get Single Capsule
```
GET /api/capsules/abc123
→ If locked and not owner: metadata only
→ If unlocked or owner: full content
```

See [api-contract.md](./api-contract.md) for all endpoints.

---

## ⚡ Performance

- Composite indexes for fast queries
- Pagination support (limit/offset)
- Lazy loading of message content
- Client-side caching recommended
- Estimated cost: <$5/month with 1000 users

---

## 🔧 Deployment

### Local Development
```bash
firebase emulators:start
# See SETUP_GUIDE.md for full steps
```

### Staging/Production
```bash
# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# See SETUP_GUIDE.md for complete guide
```

---

## 🐛 Troubleshooting

### Common Issues
- **"Cannot connect to emulator"** → Check ports (8080, 9099)
- **"Missing environment variables"** → Copy .env.example to .env.local
- **"Permission denied"** → Check security rules in firestore.rules
- **"Invalid token"** → Ensure token is valid Firebase ID token

See [SETUP_GUIDE.md](./SETUP_GUIDE.md#troubleshooting) for more.

---

## 📞 Support

### Official Documentation
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Getting Started](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

### FutureCapsule References
- Architecture: [PHASE_1_COMPLETE.md](./PHASE_1_COMPLETE.md#-architecture-overview)
- API Examples: [api-contract.md](./api-contract.md#-endpoints)
- Data Design: [firestore-schema.md](./firestore-schema.md)
- Security Rules: [firestore.rules](./firestore.rules)
- Deployment Steps: [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

## ✅ What's Included

- ✅ Complete Firestore schema design
- ✅ Security rules (user isolation, unlock validation)
- ✅ API contract (5 endpoints, all methods)
- ✅ Environment templates (dev/staging/prod)
- ✅ Configuration library (TypeScript)
- ✅ Deployment guides (step-by-step)
- ✅ Troubleshooting section
- ✅ Performance optimization tips
- ✅ Type definitions
- ✅ Code examples

---

## 🎓 Next Steps

1. **Review Documentation**
   - Start with PHASE_1_COMPLETE.md
   - Deep dive into api-contract.md
   - Understand firestore-schema.md

2. **Local Setup**
   - Copy .env.example to .env.local
   - Get Firebase credentials
   - Start emulator: `firebase emulators:start`

3. **Frontend Implementation** (Phase 2)
   - Build authentication UI
   - Create capsule form
   - Display capsules with unlock logic
   - Build capsule viewer

4. **API Implementation** (Phase 2)
   - Implement /api/capsules routes
   - Add unlock validation
   - Deploy security rules

5. **Testing** (Phase 4)
   - Test all endpoints
   - Verify security rules
   - Test unlock date logic
   - Load testing

---

## 📈 Project Status

**Phase 1**: ✅ Infrastructure Complete  
**Phase 2**: → Frontend & API Implementation (Next)  
**Phase 3**: → UI/UX & Polish  
**Phase 4**: → Testing & Deployment  
**Phase 5**: → Launch  

---

## 📄 License & Guidelines

- Follow the architecture defined in PHASE_1_COMPLETE.md
- Use security rules as-is (no deviations)
- Follow API contract for all endpoints
- Use TypeScript for all code
- Test unlock validation thoroughly

---

**Infrastructure ready for implementation. Happy coding! 🚀**

Last Updated: 2026-03-11
