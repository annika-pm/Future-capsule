# FutureCapsule API Contract

## Overview
This document defines the REST API contract for FutureCapsule backend operations. The API is designed to work with Next.js API routes and is built on top of Firebase and Firestore.

All endpoints require Firebase authentication tokens passed via `Authorization: Bearer <idToken>` header.

**Base URL**: `/api`  
**Authentication**: Firebase ID token in Authorization header  
**Response Format**: JSON  

---

## Authentication & Authorization

### Header Format
```
Authorization: Bearer <Firebase ID Token>
```

### Token Validation
- Verify token signature on server side
- Extract `uid` claim for user identification
- Check token expiration (tokens expire after 1 hour, implement refresh logic)

### Token Refresh
- Firebase client SDK auto-refreshes tokens when needed
- On 401 response, client should retry with fresh token
- For long-lived sessions, use refresh tokens (Firebase handles this)

---

## Endpoints

### 1. Create Capsule

**HTTP Method**: `POST`  
**Endpoint**: `/api/capsules`  
**Authentication**: Required  

**Request Body**:
```typescript
{
  title: string;          // 1-255 characters
  message: string;        // 1-50000 characters
  mood: Mood;             // 'Happy' | 'Motivated' | 'Confused' | 'Sad' | 'Grateful' | 'Hopeful'
  unlockDate: number;     // Unix timestamp in milliseconds (must be >= current time)
  photoURL?: string;      // Optional: Cloud Storage URL for attached photo
  status?: 'draft' | 'scheduled'; // Default: 'scheduled' (optional)
}
```

**Success Response** (201 Created):
```typescript
{
  success: true;
  data: {
    id: string;
    userId: string;
    title: string;
    message: string;
    mood: Mood;
    unlockDate: number;
    photoURL?: string;
    createdAt: number;
    updatedAt: number;
    status: 'scheduled';
    isDeleted: false;
  };
  message: string;        // "Capsule created successfully"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid request body or validation failed
  ```json
  {
    "success": false,
    "error": "validation_error",
    "message": "Invalid mood value",
    "details": { "field": "mood", "reason": "must be one of [Happy, Motivated, ...]" }
  }
  ```
- **401 Unauthorized**: Missing or invalid auth token
- **403 Forbidden**: User not authenticated
- **413 Payload Too Large**: Message exceeds 50KB limit

**Validation Rules**:
1. Title: 1-255 characters, non-empty
2. Message: 1-50000 characters, non-empty
3. Mood: Must be valid enum value
4. unlockDate: Unix timestamp >= current time (server validates)
5. photoURL: Optional, must be valid URL format; auto-filled from Cloud Storage if provided

**Business Logic**:
- Server-side generates `id` (UUID v4)
- Server sets `userId` from auth token (client cannot override)
- Server sets `createdAt` and `updatedAt` timestamps
- Default `status` = 'scheduled'
- Default `isDeleted` = false

---

### 2. Get User's Capsules

**HTTP Method**: `GET`  
**Endpoint**: `/api/capsules`  
**Authentication**: Required  
**Query Parameters**:
```
?status=scheduled      // Optional: filter by status (draft, scheduled, unlocked, archived)
?sortBy=unlockDate    // Optional: 'unlockDate' (default) or 'createdAt'
?order=asc            // Optional: 'asc' (default) or 'desc'
?limit=50             // Optional: 1-100, default 50
?offset=0             // Optional: pagination offset, default 0
```

**Success Response** (200 OK):
```typescript
{
  success: true;
  data: {
    capsules: [
      {
        id: string;
        userId: string;
        title: string;
        // message: NOT included in list view (only show in detail)
        mood: Mood;
        unlockDate: number;
        photoURL?: string;
        createdAt: number;
        updatedAt: number;
        status: 'scheduled' | 'draft' | 'unlocked' | 'archived';
        isDeleted: false;
        // Computed fields for UI
        isUnlocked: boolean;        // true if currentTime >= unlockDate
        daysUntilUnlock: number;    // >= 0 if locked, 0 if unlocked
      }
    ];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };
  message: string;    // "Capsules retrieved successfully"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid query parameters (e.g., invalid status filter)
- **401 Unauthorized**: Invalid or missing token
- **403 Forbidden**: User not authenticated

**Firestore Query**:
```
WHERE userId == auth.uid 
  AND isDeleted == false 
  [AND status == 'scheduled']  // if ?status filter provided
ORDER BY unlockDate ASC
LIMIT 50
```

**Performance**:
- Requires composite index: `userId` + `unlockDate`
- Typical response: < 200ms for < 1000 capsules
- Implement pagination to avoid large result sets

---

### 3. Get Single Capsule

**HTTP Method**: `GET`  
**Endpoint**: `/api/capsules/:id`  
**Authentication**: Required  

**URL Parameters**:
- `id` (string): Capsule document ID

**Success Response** (200 OK):
```typescript
{
  success: true;
  data: {
    id: string;
    userId: string;
    title: string;
    message: string;          // FULL MESSAGE if unlocked OR user is owner
    mood: Mood;
    unlockDate: number;
    photoURL?: string;
    createdAt: number;
    updatedAt: number;
    status: 'scheduled' | 'draft' | 'unlocked' | 'archived';
    isDeleted: false;
    // Computed fields
    isUnlocked: boolean;
    canEdit: boolean;         // true if owner AND not yet unlocked
    daysUntilUnlock: number;
  };
  message: string;            // "Capsule retrieved successfully"
}
```

**Response if Locked (User not owner, date not yet reached)**:
```typescript
{
  success: true;
  data: {
    id: string;
    title: string;
    mood: Mood;
    unlockDate: number;
    photoURL?: string;
    createdAt: number;
    // message: OMITTED (not readable yet)
    // userId: OMITTED (privacy)
    isUnlocked: false;
    daysUntilUnlock: 45;
  };
  message: string;            // "Capsule is locked. Will unlock on 2026-04-25"
}
```

**Error Responses**:
- **404 Not Found**: Capsule does not exist or user has no access
- **401 Unauthorized**: Missing or invalid token
- **403 Forbidden**: User not the owner AND capsule is locked
- **410 Gone**: Capsule was deleted (`isDeleted == true`)

**Unlock Validation Logic** (Server-Side):
```typescript
const now = new Date();
const canReadFull = 
  capsule.userId === auth.uid ||  // Owner always reads full
  now >= new Date(capsule.unlockDate);  // OR date has passed

if (!canReadFull) {
  // Return locked view (no message, no userId)
  return {
    ...capsuleMetadata,
    isUnlocked: false,
    daysUntilUnlock: Math.ceil((unlockDate - now) / (1000 * 60 * 60 * 24))
  };
}
```

---

### 4. Update Capsule

**HTTP Method**: `PUT`  
**Endpoint**: `/api/capsules/:id`  
**Authentication**: Required  

**URL Parameters**:
- `id` (string): Capsule document ID

**Request Body** (all fields optional):
```typescript
{
  title?: string;
  message?: string;
  mood?: Mood;
  photoURL?: string;
  status?: 'draft' | 'scheduled' | 'archived';
  // Cannot update: userId, unlockDate, createdAt, isDeleted
}
```

**Success Response** (200 OK):
```typescript
{
  success: true;
  data: {
    id: string;
    userId: string;
    title: string;
    message: string;
    mood: Mood;
    unlockDate: number;  // Unchanged
    photoURL?: string;
    createdAt: number;   // Unchanged
    updatedAt: number;   // Updated to current time
    status: string;
    isDeleted: false;
  };
  message: string;        // "Capsule updated successfully"
}
```

**Error Responses**:
- **400 Bad Request**: Invalid field values
- **403 Forbidden**: User is not the owner
- **409 Conflict**: Capsule is already unlocked (cannot edit)
  ```json
  {
    "success": false,
    "error": "capsule_unlocked",
    "message": "Cannot edit capsule after unlock date"
  }
  ```
- **404 Not Found**: Capsule does not exist
- **413 Payload Too Large**: Message exceeds size limit

**Business Rules**:
- Only owner can update
- Can only update before unlock date
- Cannot modify: userId, unlockDate, createdAt, isDeleted
- Server updates: updatedAt timestamp
- Partial updates allowed (can update single field)

---

### 5. Delete Capsule

**HTTP Method**: `DELETE`  
**Endpoint**: `/api/capsules/:id`  
**Authentication**: Required  

**URL Parameters**:
- `id` (string): Capsule document ID

**Success Response** (200 OK):
```typescript
{
  success: true;
  data: {
    id: string;
    deleted: true;
  };
  message: string;        // "Capsule deleted successfully"
}
```

**Error Responses**:
- **403 Forbidden**: User is not the owner
- **404 Not Found**: Capsule does not exist or already deleted
- **500 Internal Server Error**: Cloud Storage cleanup failed (but Firestore document still soft-deleted)

**Business Rules**:
- Only owner can delete
- Implements soft delete: sets `isDeleted = true`, actual deletion after retention period
- Asynchronous cleanup of Cloud Storage photo (if exists)
- Deleted capsules excluded from list queries

**Cloud Storage Cleanup**:
```
When capsule is deleted:
1. Firestore: Set isDeleted = true, updatedAt = now
2. Cloud Storage: Async job deletes /capsules/{userId}/{capsuleId}/*
3. Backup: Soft-deleted docs kept for compliance (e.g., 30 days before hard delete)
```

---

## Error Handling

### Standard Error Response Format
```typescript
{
  success: false;
  error: string;              // Error code (machine readable)
  message: string;            // Human readable message
  details?: {                 // Optional: additional context
    [key: string]: any;
  };
  timestamp: string;          // ISO 8601 timestamp
  requestId: string;          // Unique request ID for debugging
}
```

### Common Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `auth_required` | 401 | Missing authentication token |
| `invalid_token` | 401 | Token format invalid or expired |
| `forbidden` | 403 | User lacks permission (e.g., not owner) |
| `validation_error` | 400 | Request body validation failed |
| `not_found` | 404 | Resource does not exist |
| `conflict` | 409 | Resource state conflict (e.g., already unlocked) |
| `payload_too_large` | 413 | Request body exceeds size limit |
| `internal_error` | 500 | Unexpected server error |
| `service_unavailable` | 503 | Firebase service unavailable |

---

## Authentication Token Management

### Client-Side (Next.js Frontend)

**On App Load**:
```typescript
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    // Get fresh ID token
    const idToken = await user.getIdToken();
    // Add to all API requests
    headers.Authorization = `Bearer ${idToken}`;
  }
});
```

**Token Refresh**:
```typescript
// Firebase SDK handles automatic refresh
// On API 401 response, retry with fresh token
async function callAPI(endpoint, options) {
  const user = firebase.auth().currentUser;
  const idToken = await user?.getIdToken(true); // Force refresh
  
  const response = await fetch(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${idToken}`,
    },
  });
  
  if (response.status === 401) {
    // Token expired, retry once
    return retryWithFreshToken(endpoint, options);
  }
  return response;
}
```

### Server-Side (Next.js API Route)

**Verify Token**:
```typescript
import * as admin from 'firebase-admin';

async function verifyToken(token: string) {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken.uid;  // Extract user ID
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

---

## Rate Limiting

### Recommended Limits (Per User)
- **List capsules**: 100 requests/minute
- **Create capsule**: 10 requests/minute
- **Read capsule**: 300 requests/minute
- **Update capsule**: 50 requests/minute
- **Delete capsule**: 20 requests/minute

### Implementation
Use Cloud Functions or Next.js middleware to enforce rate limits (Firestore doesn't have built-in rate limiting).

---

## Pagination Pattern

For endpoints returning lists:

**Request**:
```
GET /api/capsules?limit=20&offset=40
```

**Response**:
```typescript
{
  success: true;
  data: {
    capsules: [ ... ],
    pagination: {
      total: 125,        // Total items available
      limit: 20,         // Items per page
      offset: 40,        // Current page start
      hasMore: true      // More items available
    };
  };
}
```

**Client-Side Usage**:
```typescript
const [offset, setOffset] = useState(0);
const limit = 20;

async function loadMore() {
  const response = await fetch(`/api/capsules?limit=${limit}&offset=${offset + limit}`);
  const { data } = await response.json();
  setOffset(offset + limit);
  // Append to existing capsules
}
```

---

## Response Codes Reference

| Code | Meaning |
|------|---------|
| 200 | Success (with data returned) |
| 201 | Created (resource successfully created) |
| 204 | No Content (operation successful, no data) |
| 400 | Bad Request (client error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (user lacks permission) |
| 404 | Not Found (resource doesn't exist) |
| 409 | Conflict (state violation, e.g., can't edit unlocked capsule) |
| 413 | Payload Too Large (request too big) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## Best Practices for Frontend Integration

1. **Error Handling**: Always check `response.ok` or `data.success` before accessing data
2. **Token Management**: Let Firebase SDK handle token refresh automatically
3. **Request IDs**: Log `requestId` from error responses for debugging
4. **Optimistic Updates**: Update UI optimistically, revert on error
5. **Polling**: Use Firebase Firestore listeners instead of polling for real-time updates
6. **Caching**: Cache capsule data client-side with SWR or React Query
7. **Timeout**: Set timeout to 30 seconds for all API requests

---

## Testing Checklist

- [ ] GET /api/capsules with valid token → returns user's capsules
- [ ] GET /api/capsules with invalid token → 401 error
- [ ] POST /api/capsules with valid data → creates capsule, returns 201
- [ ] POST /api/capsules with invalid mood → 400 error with details
- [ ] GET /api/capsules/:id for locked capsule as owner → returns full message
- [ ] GET /api/capsules/:id for locked capsule as non-owner → returns metadata only
- [ ] GET /api/capsules/:id for unlocked capsule as anyone → returns full message
- [ ] PUT /api/capsules/:id after unlock → 409 error
- [ ] DELETE /api/capsules/:id as non-owner → 403 error
- [ ] Rate limiting triggers at configured threshold
- [ ] Token refresh on 401 and retry succeeds
