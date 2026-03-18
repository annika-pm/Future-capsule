# FutureCapsule API Documentation

Complete API reference for the FutureCapsule time capsule application.

## 📋 Overview

The FutureCapsule API provides secure time-locked messaging with mood tracking. All endpoints require authentication and enforce server-side unlock validation.

### Base URL
```
https://your-domain.com/api
```

### Authentication
All API requests require a Bearer token:
```
Authorization: Bearer <firebase_id_token>
```

### Response Format
```json
{
  "success": boolean,
  "data": object | array | null,
  "message": string,
  "error"?: string,
  "statusCode"?: number
}
```

## 🔐 Authentication Endpoints

### POST /api/auth/signup
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "displayName": "John Doe",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  },
  "message": "User created successfully"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Email already exists",
  "error": "auth/email-already-in-use",
  "statusCode": 409
}
```

### POST /api/auth/login
Authenticate an existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "displayName": "John Doe"
    },
    "token": "firebase_id_token"
  },
  "message": "Login successful"
}
```

### POST /api/auth/google
Authenticate with Google OAuth.

**Request:**
```json
{
  "idToken": "google_oauth_token"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "displayName": "John Doe"
    },
    "token": "firebase_id_token"
  },
  "message": "Google authentication successful"
}
```

## 📦 Capsule Endpoints

### POST /api/capsules
Create a new time capsule.

**Request:**
```json
{
  "title": "Letter to Future Me",
  "message": "Hi future self! Remember to...",
  "mood": "Happy",
  "unlockDate": "2025-12-31T23:59:59Z",
  "photoURL": "https://storage.googleapis.com/..."
}
```

**Validation Rules:**
- `title`: Required, max 255 characters
- `message`: Required, max 50,000 characters
- `mood`: Required, one of: "Happy", "Motivated", "Confused", "Sad", "Grateful", "Hopeful"
- `unlockDate`: Required, must be future date
- `photoURL`: Optional, valid URL

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "capsule": {
      "id": "capsule-uuid",
      "userId": "user-uuid",
      "title": "Letter to Future Me",
      "message": "Hi future self! Remember to...",
      "mood": "Happy",
      "unlockDate": "2025-12-31T23:59:59Z",
      "photoURL": "https://storage.googleapis.com/...",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z",
      "status": "scheduled",
      "isDeleted": false
    }
  },
  "message": "Capsule created successfully"
}
```

### GET /api/capsules
List user's capsules with filtering and pagination.

**Query Parameters:**
- `status`: `"all"` | `"locked"` | `"unlocked"` | `"opening-soon"` (default: "all")
- `sortBy`: `"unlockDate"` | `"createdAt"` (default: "unlockDate")
- `order`: `"asc"` | `"desc"` (default: "asc")
- `limit`: number (default: 50, max: 100)
- `offset`: number (default: 0)

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "capsules": [
      {
        "id": "capsule-uuid",
        "title": "Letter to Future Me",
        "mood": "Happy",
        "unlockDate": "2025-12-31T23:59:59Z",
        "createdAt": "2024-01-01T00:00:00Z",
        "status": "scheduled",
        "isUnlocked": false,
        "timeUntilUnlock": {
          "days": 365,
          "hours": 0,
          "minutes": 0,
          "seconds": 0
        }
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  },
  "message": "Capsules retrieved successfully"
}
```

**Status Filtering:**
- `"locked"`: Capsules with future unlock dates
- `"unlocked"`: Capsules with past unlock dates
- `"opening-soon"`: Capsules unlocking within 24 hours
- `"all"`: All capsules

### GET /api/capsules/[id]
Get a single capsule with unlock validation.

**Response (Locked Capsule):**
```json
{
  "success": true,
  "data": {
    "capsule": {
      "id": "capsule-uuid",
      "title": "Letter to Future Me",
      "mood": "Happy",
      "unlockDate": "2025-12-31T23:59:59Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "status": "scheduled",
      "isUnlocked": false,
      "canEdit": true,
      "timeUntilUnlock": {
        "days": 365,
        "hours": 0,
        "minutes": 0,
        "seconds": 0
      }
      // Note: message is NOT included for locked capsules
    }
  },
  "message": "Capsule retrieved successfully"
}
```

**Response (Unlocked Capsule):**
```json
{
  "success": true,
  "data": {
    "capsule": {
      "id": "capsule-uuid",
      "title": "Letter to Future Me",
      "message": "Hi future self! Remember to...",
      "mood": "Happy",
      "unlockDate": "2024-01-01T00:00:00Z", // Past date
      "photoURL": "https://storage.googleapis.com/...",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z",
      "status": "unlocked",
      "isUnlocked": true,
      "canEdit": false,
      "timeUntilUnlock": null
    }
  },
  "message": "Capsule retrieved successfully"
}
```

### PUT /api/capsules/[id]
Update a capsule (only before unlock date).

**Request:**
```json
{
  "title": "Updated Title",
  "message": "Updated message content",
  "mood": "Motivated",
  "photoURL": "https://storage.googleapis.com/new-photo.jpg"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "capsule": {
      "id": "capsule-uuid",
      "title": "Updated Title",
      "message": "Updated message content",
      "mood": "Motivated",
      "unlockDate": "2025-12-31T23:59:59Z",
      "photoURL": "https://storage.googleapis.com/new-photo.jpg",
      "updatedAt": "2024-01-02T00:00:00Z"
    }
  },
  "message": "Capsule updated successfully"
}
```

**Response (Error - Already Unlocked):**
```json
{
  "success": false,
  "message": "Cannot edit unlocked capsule",
  "error": "capsule_already_unlocked",
  "statusCode": 403
}
```

### DELETE /api/capsules/[id]
Soft delete a capsule.

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "deletedAt": "2024-01-01T12:00:00Z"
  },
  "message": "Capsule deleted successfully"
}
```

## 👤 User Endpoints

### GET /api/user
Get current user profile.

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "displayName": "John Doe",
      "photoURL": null,
      "timezone": "America/New_York",
      "emailNotifications": true,
      "status": "active",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  },
  "message": "User profile retrieved successfully"
}
```

### PUT /api/user
Update user profile.

**Request:**
```json
{
  "displayName": "John Smith",
  "timezone": "America/New_York",
  "emailNotifications": false
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "displayName": "John Smith",
      "timezone": "America/New_York",
      "emailNotifications": false,
      "updatedAt": "2024-01-02T00:00:00Z"
    }
  },
  "message": "Profile updated successfully"
}
```

## 📊 Analytics Endpoints

### GET /api/analytics/mood-stats
Get mood statistics for insights dashboard.

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalCapsules": 25,
      "unlockedCapsules": 10,
      "averageMood": "Happy",
      "moodDistribution": {
        "Happy": 12,
        "Motivated": 8,
        "Grateful": 3,
        "Sad": 2
      },
      "timeline": [
        {
          "date": "2024-01",
          "mood": "Happy",
          "count": 5
        }
      ]
    }
  },
  "message": "Mood statistics retrieved successfully"
}
```

## 🚨 Error Responses

### Common Error Codes

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | `validation_error` | Invalid request data |
| 401 | `unauthorized` | Missing or invalid authentication |
| 403 | `forbidden` | Not authorized for this action |
| 404 | `not_found` | Resource not found |
| 409 | `conflict` | Resource already exists |
| 429 | `rate_limited` | Too many requests |
| 500 | `internal_error` | Server error |

### Validation Errors

**Response (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "error": "validation_error",
  "statusCode": 400,
  "details": {
    "title": "Title is required",
    "unlockDate": "Unlock date must be in the future"
  }
}
```

## 🔒 Security Features

### Authentication
- All endpoints require valid Firebase ID token
- Tokens are validated server-side
- User context is extracted from JWT claims

### Authorization
- Users can only access their own data
- Capsule ownership is enforced at database level
- Edit permissions are checked before unlock date

### Data Protection
- Messages are hidden until unlock date
- Server-side time validation (not client-trust)
- Input sanitization and validation
- Rate limiting on API endpoints

### Audit Trail
- All changes are timestamped
- Soft deletes preserve data integrity
- User actions are logged

## 📱 Client Integration Examples

### JavaScript/TypeScript

```javascript
// Authentication
const login = async (email, password) => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const result = await response.json();
  if (result.success) {
    // Store token
    localStorage.setItem('token', result.data.token);
  }
  return result;
};

// Create Capsule
const createCapsule = async (capsuleData) => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/capsules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(capsuleData)
  });

  return await response.json();
};

// List Capsules
const listCapsules = async (status = 'all') => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/capsules?status=${status}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return await response.json();
};
```

### React Hooks

```typescript
// Custom hook for capsules
const useCapsules = (status = 'all') => {
  const [capsules, setCapsules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCapsules = async () => {
      try {
        const result = await listCapsules(status);
        if (result.success) {
          setCapsules(result.data.capsules);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCapsules();
  }, [status]);

  return { capsules, loading };
};
```

## 🧪 Testing

### Unit Tests
```bash
npm test -- --testPathPattern=unlock-validation
npm test -- --testPathPattern=auth-middleware
```

### Integration Tests
```bash
npm run test:e2e
```

### API Testing with cURL
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Create capsule
curl -X POST http://localhost:3000/api/capsules \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Hello","mood":"Happy","unlockDate":"2025-01-01T00:00:00Z"}'
```

## 📊 Rate Limits

- **Authenticated requests**: 1000 per hour per user
- **Unauthenticated requests**: 100 per hour per IP
- **File uploads**: 10 per hour per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

## 🔄 Versioning

API versioning is handled through URL paths:
- Current version: No prefix (v1)
- Future versions: `/api/v2/endpoint`

Breaking changes will be communicated in advance.

## 🆘 Troubleshooting

### Common Issues

**401 Unauthorized**
- Check that Authorization header is present
- Verify token is not expired
- Ensure token format: `Bearer <token>`

**403 Forbidden**
- Verify user owns the resource
- Check if capsule is already unlocked (for edits)
- Ensure proper authentication

**400 Bad Request**
- Check request body format
- Validate all required fields
- Verify data types and constraints

**404 Not Found**
- Verify endpoint URL
- Check resource ID exists
- Ensure user has access to resource

### Debug Mode

Enable debug logging in development:
```env
DEBUG=api:*
```

## 📚 Related Documentation

- [Database Schema](SUPABASE_DATABASE_SCHEMA.md) - PostgreSQL tables and relationships
- [Authentication Flow](SUPABASE_AUTHENTICATION_FLOW.md) - Complete auth implementation
- [Frontend Integration](SUPABASE_FRONTEND_MIGRATION.md) - Client-side usage examples
- [Security Policies](SUPABASE_RLS_POLICIES.md) - Row Level Security details

---

**Last Updated**: March 2024
**API Version**: 1.0
**Status**: Production Ready ✅</content>
<parameter name="filePath">c:\Users\Annika.Prasanna\Desktop\dummy\API_DOCUMENTATION.md