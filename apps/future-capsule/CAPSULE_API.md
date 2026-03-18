# FutureCapsule Capsule API Documentation

## Overview

This document provides complete API reference for the FutureCapsule capsule management system. All endpoints require Firebase authentication and enforce server-side unlock validation.

**Base URL**: `/api`  
**Authentication**: Firebase ID Token in `Authorization: Bearer <token>` header  
**Response Format**: JSON

---

## Authentication

### Header Format
All requests must include the Authorization header with a valid Firebase ID token:

```
Authorization: Bearer <Firebase ID Token>
```

### Token Requirements
- Required for all endpoints
- Must be a valid Firebase ID token
- Token expiration checked on server (1-hour validity)
- Invalid/expired tokens return 401 Unauthorized

### Example Request with Auth
```bash
curl -X GET https://localhost:3000/api/capsules \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

---

## Endpoints

### 1. Create Capsule

**POST** `/api/capsules`

Creates a new capsule letter for the authenticated user with server-side validation of all fields.

#### Request Headers
```
Authorization: Bearer <Firebase ID Token>
Content-Type: application/json
```

#### Request Body
```typescript
{
  title: string;          // Required: 1-255 characters
  message: string;        // Required: 1-50,000 characters
  mood: Mood;             // Required: 'Happy' | 'Motivated' | 'Confused' | 'Sad' | 'Grateful' | 'Hopeful'
  unlockDate: string;     // Required: ISO 8601 timestamp (must be >= today)
  photoURL?: string;      // Optional: Valid URL to photo in Cloud Storage
}
```

#### Response (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "firebase_auth_uid",
    "title": "Letter to My Future Self",
    "message": "This is my letter...",
    "mood": "Happy",
    "unlockDate": "2026-12-31T23:59:59.000Z",
    "photoURL": "https://storage.googleapis.com/...",
    "createdAt": "2025-03-11T10:30:00.000Z",
    "updatedAt": "2025-03-11T10:30:00.000Z",
    "status": "scheduled",
    "isDeleted": false
  },
  "message": "Capsule created successfully"
}
```

#### Error Responses

**400 Bad Request** - Validation failed
```json
{
  "success": false,
  "error": "validation_error",
  "message": "Invalid capsule data",
  "statusCode": 400,
  "timestamp": "2025-03-11T10:30:00.000Z",
  "details": {
    "title": "Title must not exceed 255 characters",
    "mood": "Mood must be one of: Happy, Motivated, Confused, Sad, Grateful, Hopeful"
  }
}
```

**401 Unauthorized** - Missing/invalid auth token
```json
{
  "success": false,
  "error": "authentication_error",
  "message": "Missing authorization header",
  "statusCode": 401,
  "timestamp": "2025-03-11T10:30:00.000Z"
}
```

#### Validation Rules
- **Title**: Non-empty, max 255 characters
- **Message**: Non-empty, max 50,000 characters
- **Mood**: Must be one of the predefined values
- **Unlock Date**: Must be ISO 8601 format, >= today's date (server-side validation)
- **PhotoURL**: Must be valid URL if provided

#### Example Request
```bash
curl -X POST https://localhost:3000/api/capsules \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Letter to 2026 Me",
    "message": "Remember when...",
    "mood": "Hopeful",
    "unlockDate": "2026-12-31T23:59:59Z",
    "photoURL": "https://example.com/photo.jpg"
  }'
```

---

### 2. Get User's Capsules

**GET** `/api/capsules`

Fetches all capsules for the authenticated user with optional filtering and pagination.

#### Request Headers
```
Authorization: Bearer <Firebase ID Token>
```

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | `all` | Filter by status: `locked`, `unlocked`, `opening-soon`, or `all` |
| `sortBy` | string | `unlockDate` | Sort field: `unlockDate` or `createdAt` |
| `order` | string | `asc` | Sort order: `asc` (ascending) or `desc` (descending) |
| `limit` | number | `50` | Results per page (1-100) |
| `offset` | number | `0` | Pagination offset |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "capsules": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "userId": "firebase_auth_uid",
        "title": "Letter to 2026 Me",
        "mood": "Hopeful",
        "unlockDate": "2026-12-31T23:59:59.000Z",
        "photoURL": "https://storage.googleapis.com/...",
        "createdAt": "2025-03-11T10:30:00.000Z",
        "updatedAt": "2025-03-11T10:30:00.000Z",
        "status": "scheduled",
        "isUnlocked": false
      }
    ],
    "pagination": {
      "total": 42,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  },
  "message": "Capsules retrieved successfully"
}
```

**Note**: `message` field is omitted from list view for locked capsules (only available in detail view).

#### Example Requests

List all capsules, sorted by unlock date:
```bash
curl -X GET "https://localhost:3000/api/capsules?status=all&sortBy=unlockDate&order=asc" \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

Get unlocked capsules only:
```bash
curl -X GET "https://localhost:3000/api/capsules?status=unlocked" \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

Get locked capsules with pagination:
```bash
curl -X GET "https://localhost:3000/api/capsules?status=locked&limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

---

### 3. Get Single Capsule

**GET** `/api/capsules/{id}`

Fetches a single capsule with unlock validation. Returns full content if unlocked, preview only if locked.

#### Request Headers
```
Authorization: Bearer <Firebase ID Token>
```

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Capsule ID (UUID) |

#### Response (200 OK) - Unlocked Capsule

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "firebase_auth_uid",
    "title": "Letter to My Future Self",
    "message": "This is my letter content...",
    "mood": "Happy",
    "unlockDate": "2025-03-15T12:00:00.000Z",
    "photoURL": "https://storage.googleapis.com/...",
    "createdAt": "2025-03-11T10:30:00.000Z",
    "updatedAt": "2025-03-11T10:30:00.000Z",
    "status": "scheduled",
    "isUnlocked": true,
    "canEdit": false
  },
  "message": "Capsule retrieved successfully"
}
```

#### Response (200 OK) - Locked Capsule

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "firebase_auth_uid",
    "title": "Letter to My Future Self",
    "mood": "Happy",
    "unlockDate": "2025-12-31T23:59:59.000Z",
    "photoURL": "https://storage.googleapis.com/...",
    "createdAt": "2025-03-11T10:30:00.000Z",
    "updatedAt": "2025-03-11T10:30:00.000Z",
    "isUnlocked": false,
    "canEdit": true,
    "timeUntilUnlock": {
      "days": 295,
      "hours": 13,
      "minutes": 29,
      "seconds": 59
    }
  },
  "message": "Capsule retrieved successfully"
}
```

**Note**: 
- `message` field only included if unlocked
- `canEdit` is true if capsule can still be edited (before unlock date)
- `timeUntilUnlock` only present for locked capsules

#### Error Responses

**404 Not Found** - Capsule not found
```json
{
  "success": false,
  "error": "not_found_error",
  "message": "Capsule not found",
  "statusCode": 404,
  "timestamp": "2025-03-11T10:30:00.000Z"
}
```

**403 Forbidden** - Unauthorized access
```json
{
  "success": false,
  "error": "authorization_error",
  "message": "You do not have permission to access this resource",
  "statusCode": 403,
  "timestamp": "2025-03-11T10:30:00.000Z"
}
```

#### Example Requests

Get capsule by ID:
```bash
curl -X GET "https://localhost:3000/api/capsules/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

---

### 4. Update Capsule

**PUT** `/api/capsules/{id}`

Updates a capsule before its unlock date. Cannot edit after unlock or modify protected fields.

#### Request Headers
```
Authorization: Bearer <Firebase ID Token>
Content-Type: application/json
```

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Capsule ID (UUID) |

#### Request Body (all fields optional)
```typescript
{
  title?: string;      // Updated title (1-255 chars)
  message?: string;    // Updated message (1-50,000 chars)
  mood?: Mood;         // Updated mood
  photoURL?: string;   // Updated photo URL (or null to remove)
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "capsuleId": "550e8400-e29b-41d4-a716-446655440000",
    "updatedAt": "2025-03-11T10:35:00.000Z"
  },
  "message": "Capsule updated successfully"
}
```

#### Error Responses

**400 Bad Request** - Validation failed or locked capsule
```json
{
  "success": false,
  "error": "validation_error",
  "message": "Cannot edit capsule after unlock date has passed",
  "statusCode": 400,
  "timestamp": "2025-03-11T10:30:00.000Z"
}
```

**403 Forbidden** - Cannot edit after unlock
```json
{
  "success": false,
  "error": "authorization_error",
  "message": "Cannot edit capsule after unlock date has passed",
  "statusCode": 403,
  "timestamp": "2025-03-11T10:30:00.000Z"
}
```

#### Restrictions
- Cannot edit **after** unlock date has passed
- Cannot modify: `unlockDate`, `createdAt`, `userId`, `status`
- Cannot modify: `isDeleted` field
- All validation rules from create apply

#### Example Request

Update title and message:
```bash
curl -X PUT "https://localhost:3000/api/capsules/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "message": "Updated message content..."
  }'
```

Update mood only:
```bash
curl -X PUT "https://localhost:3000/api/capsules/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mood": "Grateful"}'
```

---

### 5. Delete Capsule

**DELETE** `/api/capsules/{id}`

Soft-deletes a capsule (sets `isDeleted=true`). Preserves data for auditing and potential recovery.

#### Request Headers
```
Authorization: Bearer <Firebase ID Token>
```

#### URL Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Capsule ID (UUID) |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "capsuleId": "550e8400-e29b-41d4-a716-446655440000",
    "deletedAt": "2025-03-11T10:40:00.000Z"
  },
  "message": "Capsule deleted successfully"
}
```

#### Error Responses

**404 Not Found** - Capsule not found (already deleted or never existed)
```json
{
  "success": false,
  "error": "not_found_error",
  "message": "Capsule not found",
  "statusCode": 404,
  "timestamp": "2025-03-11T10:30:00.000Z"
}
```

#### Example Request

Delete a capsule:
```bash
curl -X DELETE "https://localhost:3000/api/capsules/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

---

## Common Response Format

All API responses follow this structure:

### Success Response
```typescript
{
  success: true;
  data: Record<string, any>;      // Response data varies by endpoint
  message: string;                // Human-readable success message
}
```

### Error Response
```typescript
{
  success: false;
  error: string;                  // Error code (e.g., 'validation_error')
  message: string;                // Human-readable error message
  statusCode: number;             // HTTP status code
  timestamp: string;              // ISO 8601 timestamp
  details?: Record<string, unknown>; // Additional error context
}
```

---

## Unlock Validation Logic

### How Unlock Works

Unlock date validation is performed entirely on the server to prevent client-side bypassing:

1. **Locked Capsule**: Current time < Unlock time
   - Return: metadata only (title, mood, unlock date)
   - Return: countdown timer data
   - Do NOT include: `message` field
   - `canEdit`: true (can still edit before unlock)

2. **Opening Soon**: Unlock time - 1 hour < Current time < Unlock time
   - Return: same as locked capsule
   - Visual indicator: "Opening in..." instead of countdown

3. **Unlocked Capsule**: Current time >= Unlock time
   - Return: full content including `message`
   - `isUnlocked`: true
   - `canEdit`: false (cannot edit after unlock)

### Server-Side Timestamp Comparison

All timestamps use ISO 8601 format (UTC). Server compares:

```
Now >= UnlockDate → Unlocked
Now < UnlockDate → Locked
```

Never trust client-side time calculations.

---

## Error Codes Reference

| Status | Error Code | Meaning | Example |
|--------|-----------|---------|---------|
| 400 | `validation_error` | Invalid request data | Invalid mood value, title too long |
| 401 | `authentication_error` | Missing/invalid auth token | Expired token, missing header |
| 403 | `authorization_error` | User lacks permission | Accessing other user's capsule |
| 404 | `not_found_error` | Resource not found | Capsule ID doesn't exist |
| 409 | `conflict_error` | Operation conflict | (Reserved for future use) |
| 500 | `server_error` | Unexpected server error | Database failure |

---

## Implementation Examples

### JavaScript/TypeScript (Fetch API)

```typescript
// Get Firebase ID token
const user = auth.currentUser;
const idToken = await user?.getIdToken();

// Create capsule
const response = await fetch('/api/capsules', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Letter to 2026',
    message: 'Remember...',
    mood: 'Hopeful',
    unlockDate: '2026-12-31T23:59:59Z',
  }),
});

const data = await response.json();
if (data.success) {
  console.log('Capsule created:', data.data.id);
}
```

### React Hook (useAuth from AuthContext)

```typescript
import { useAuth } from '@/hooks/useAuth';

function CreateCapsule() {
  const { user, getIdToken } = useAuth();

  const handleCreate = async (capsuleData) => {
    const idToken = await getIdToken();
    
    const response = await fetch('/api/capsules', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(capsuleData),
    });

    const result = await response.json();
    return result;
  };

  return (
    // Form component here
  );
}
```

---

## Security Considerations

### Client-Side Security
1. Always include Firebase ID token in Authorization header
2. Never send token in URL parameters
3. Use HTTPS only (enforced by Firebase)
4. Let Firebase SDK handle token refresh

### Server-Side Security
1. Validate all unlock dates on server (never trust client)
2. Verify user ownership before returning/modifying data
3. Prevent modification of: `unlockDate`, `userId`, `createdAt`, `status`
4. Log unauthorized access attempts
5. Use Firestore security rules as second layer

### Data Protection
- User data isolated by `userId` in Firestore
- Soft deletes preserve audit trails
- All timestamps use server-side generation
- No sensitive data in response unless authorized

---

## Rate Limiting

Currently no rate limiting implemented. For production:
- Implement API rate limits (recommend 100 req/min per user)
- Use middleware like `express-rate-limit`
- Return `429 Too Many Requests` when exceeded

---

## Caching Strategy

For future optimization:

- **List Capsules**: Cache 5-15 minutes, invalidate on create/update/delete
- **Single Capsule**: Cache 5 minutes, invalidate on update
- **Capsule Counts**: Cache 30 minutes, invalidate on status change
- Use Redis or Memcached for distributed caching
- Cache key pattern: `capsules:${userId}:{status}`

---

## Related Documentation

- [Firestore Schema](./firestore-schema.md) - Database structure
- [Security Rules](./firestore.rules) - Firestore access control
- [Setup Guide](./SETUP_GUIDE.md) - Environment and deployment
