# Frontend Integration Guide - Phase 2 Backend

**For**: Frontend Developer  
**Status**: Backend Ready for Integration  
**Phase**: 2 Backend + Phase 3 Frontend Implementation

---

## Quick Start: Using the Capsule API

### 1. Get Authentication Token

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, getIdToken } = useAuth();

  const makeApiCall = async () => {
    // Get the current ID token
    const idToken = await user?.getIdToken();
    
    if (!idToken) {
      console.error('User not authenticated');
      return;
    }

    // Use this token in all API calls
    const headers = {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    };

    // ... rest of API call
  };
}
```

### 2. Create a Capsule

```typescript
async function createCapsule({
  title: string,
  message: string,
  mood: 'Happy' | 'Motivated' | 'Confused' | 'Sad' | 'Grateful' | 'Hopeful',
  unlockDate: Date,
  photoURL?: string,
}) {
  const idToken = await user?.getIdToken();

  const response = await fetch('/api/capsules', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
      message,
      mood,
      unlockDate: unlockDate.toISOString(), // Must be ISO string
      photoURL,
    }),
  });

  const result = await response.json();

  if (result.success) {
    const capsuleId = result.data.id;
    console.log('Created capsule:', capsuleId);
    return result.data;
  } else {
    console.error('Creation failed:', result.error, result.message);
    throw new Error(result.message);
  }
}
```

### 3. List All Capsules

```typescript
async function listCapsules({
  status = 'all', // 'locked' | 'unlocked' | 'opening-soon' | 'all'
  sortBy = 'unlockDate', // 'unlockDate' or 'createdAt'
  order = 'asc', // 'asc' or 'desc'
  limit = 50,
  offset = 0,
}) {
  const idToken = await user?.getIdToken();

  const params = new URLSearchParams({
    status,
    sortBy,
    order,
    limit: limit.toString(),
    offset: offset.toString(),
  });

  const response = await fetch(`/api/capsules?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
  });

  const result = await response.json();

  if (result.success) {
    const capsules = result.data.capsules;
    const pagination = result.data.pagination;

    console.log(`Found ${pagination.total} capsules`);
    return { capsules, pagination };
  } else {
    throw new Error(result.message);
  }
}
```

### 4. Get Single Capsule (with Unlock Validation)

```typescript
async function getCapsule(capsuleId: string) {
  const idToken = await user?.getIdToken();

  const response = await fetch(`/api/capsules/${capsuleId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
  });

  const result = await response.json();

  if (result.success) {
    const capsule = result.data;

    if (capsule.isUnlocked) {
      // Capsule is unlocked - show full content
      console.log('Message:', capsule.message);
      console.log('Can edit:', capsule.canEdit); // Should be false
    } else {
      // Capsule is locked - show preview with countdown
      console.log('Countdown:', capsule.timeUntilUnlock);
      console.log('Can edit:', capsule.canEdit); // Should be true
      // Do NOT have access to capsule.message
    }

    return capsule;
  } else {
    throw new Error(result.message);
  }
}
```

### 5. Update Capsule (Before Unlock)

```typescript
async function updateCapsule(
  capsuleId: string,
  updates: {
    title?: string,
    message?: string,
    mood?: string,
    photoURL?: string | null,
  }
) {
  const idToken = await user?.getIdToken();

  const response = await fetch(`/api/capsules/${capsuleId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  const result = await response.json();

  if (result.success) {
    console.log('Updated at:', result.data.updatedAt);
    return result.data;
  } else {
    if (result.statusCode === 403) {
      console.error('Cannot edit: capsule is already unlocked');
    }
    throw new Error(result.message);
  }
}
```

### 6. Delete Capsule

```typescript
async function deleteCapsule(capsuleId: string) {
  const idToken = await user?.getIdToken();

  const response = await fetch(`/api/capsules/${capsuleId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${idToken}`,
    },
  });

  const result = await response.json();

  if (result.success) {
    console.log('Deleted at:', result.data.deletedAt);
    return result.data;
  } else {
    throw new Error(result.message);
  }
}
```

---

## Error Handling Pattern

```typescript
async function callApi(method, endpoint, body?) {
  try {
    const idToken = await user?.getIdToken();

    if (!idToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const result = await response.json();

    if (!result.success) {
      // Handle API error
      switch (result.statusCode) {
        case 400:
          console.error('Validation error:', result.details);
          // Show user the validation details
          break;
        case 401:
          console.error('Authentication failed');
          // Redirect to login
          break;
        case 403:
          console.error('Not authorized:', result.message);
          // Show permission denied
          break;
        case 404:
          console.error('Resource not found');
          // Show not found message
          break;
        default:
          console.error('Server error:', result.message);
      }
      throw new Error(result.message);
    }

    return result.data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

---

## Component Examples

### CapsuleForm Component (Create)

```typescript
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function CapsuleForm() {
  const { user, getIdToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: {
    title: string,
    message: string,
    mood: Mood,
    unlockDate: Date,
    photoURL?: string,
  }) => {
    try {
      setLoading(true);
      const idToken = await user?.getIdToken();

      const response = await fetch('/api/capsules', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          unlockDate: formData.unlockDate.toISOString(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Created successfully
        console.log('Capsule created:', result.data.id);
        // Redirect to dashboard or show success
      } else {
        // Show error to user
        alert(result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      // Collect form data and call handleSubmit
    }}>
      {/* Form fields */}
    </form>
  );
}
```

### CapsuleViewer Component (View + Unlock)

```typescript
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function CapsuleViewer({ capsuleId }: { capsuleId: string }) {
  const { user, getIdToken } = useAuth();
  const [capsule, setCapsule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCapsule = async () => {
      try {
        const idToken = await user?.getIdToken();

        const response = await fetch(`/api/capsules/${capsuleId}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });

        const result = await response.json();

        if (result.success) {
          setCapsule(result.data);
        } else {
          console.error('Failed to fetch capsule:', result.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCapsule();
  }, [capsuleId, user, getIdToken]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!capsule) {
    return <div>Capsule not found</div>;
  }

  if (capsule.isUnlocked) {
    // Display unlocked content
    return (
      <div>
        <h1>{capsule.title}</h1>
        <div>Mood: {capsule.mood}</div>
        <div>{capsule.message}</div>
      </div>
    );
  } else {
    // Display locked preview with countdown
    return (
      <div>
        <h1>{capsule.title}</h1>
        <div>Mood: {capsule.mood}</div>
        <CountdownTimer timeUntilUnlock={capsule.timeUntilUnlock} />
        <p>Unlocks at: {new Date(capsule.unlockDate).toLocaleDateString()}</p>
      </div>
    );
  }
}
```

### Dashboard Component (List + Filter)

```typescript
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function Dashboard() {
  const { user, getIdToken } = useAuth();
  const [capsules, setCapsules] = useState([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCapsules = async () => {
      try {
        setLoading(true);
        const idToken = await user?.getIdToken();

        const params = new URLSearchParams({ status });
        const response = await fetch(`/api/capsules?${params}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });

        const result = await response.json();

        if (result.success) {
          setCapsules(result.data.capsules);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCapsules();
  }, [status, user, getIdToken]);

  return (
    <div>
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="all">All</option>
        <option value="locked">Locked</option>
        <option value="unlocked">Unlocked</option>
        <option value="opening-soon">Opening Soon</option>
      </select>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div>
          {capsules.map(capsule => (
            <CapsuleCard key={capsule.id} capsule={capsule} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Key Points for Frontend Developers

1. **Always Get Fresh Token**: Call `getIdToken()` before each API request
   - Firebase handles token refresh automatically
   - Old tokens may expire
   - Best practice: Get token as close as possible to API call

2. **Unlock Validation is Server-Side**
   - Never use client-side time to determine if unlocked
   - Always trust the `isUnlocked` flag in response
   - Use `timeUntilUnlock` for countdown display

3. **Locked Capsules Don't Have Messages**
   - `capsule.message` will be undefined if locked
   - Check `capsule.isUnlocked` before accessing message content

4. **Edit Only Before Unlock**
   - Check `capsule.canEdit` before showing edit button
   - PUT request will fail (403) if trying to edit after unlock
   - Give users warning when getting close to unlock date

5. **Soft Deletes Are Permanent** (From User Perspective)
   - Once deleted, capsule is hidden from user
   - Cannot restore from frontend
   - No recovery option in UI

6. **Pagination**
   - Default limit: 50 capsules per page
   - Use offset to fetch more
   - Check `pagination.hasMore` to show "Load More" button

7. **Error Handling**
   - Always check `result.success` before accessing `result.data`
   - Use `result.statusCode` and `result.error` for specific error handling
   - Use `result.details` for validation error details (field names)

8. **Token in Header**
   - Format: `Authorization: Bearer <token>`
   - Case-sensitive: must be `Bearer` (capital B)
   - Include in all API requests

---

## API Response Types (TypeScript)

```typescript
// Types for reference - already defined in types/index.ts

interface Capsule {
  id: string;
  userId: string;
  title: string;
  message?: string; // Only if unlocked
  mood: Mood;
  unlockDate: string; // ISO string
  photoURL?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  status: 'scheduled' | 'draft' | 'unlocked' | 'archived';
  isDeleted: boolean;
  isUnlocked?: boolean; // From API response
  canEdit?: boolean; // From API response
  timeUntilUnlock?: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
  statusCode?: number;
  details?: Record<string, any>;
}

type Mood = 'Happy' | 'Motivated' | 'Confused' | 'Sad' | 'Grateful' | 'Hopeful';
```

---

## Testing the API

### Using cURL

```bash
# Get token first (from your Firebase app)
TOKEN="your_firebase_id_token"

# Create a capsule
curl -X POST http://localhost:3000/api/capsules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Capsule",
    "message": "This is a test",
    "mood": "Happy",
    "unlockDate": "2026-12-31T23:59:59Z"
  }'

# List capsules
curl http://localhost:3000/api/capsules \
  -H "Authorization: Bearer $TOKEN"

# Get single capsule
curl http://localhost:3000/api/capsules/ID \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman/Thunder Client

1. Create a collection
2. For each request set header: `Authorization: Bearer <token>`
3. Set Content-Type: `application/json` for POST/PUT
4. Body should be JSON for POST/PUT

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Missing/invalid token | Call `getIdToken()` and include in header |
| 400 Bad Request | Invalid data | Check validation errors in response.details |
| 403 Forbidden | Trying to edit unlocked | Check `canEdit` flag before allowing edit |
| 404 Not Found | Capsule doesn't exist | Verify capsuleId exists |
| 500 Server Error | Database failure | Check browser console, Firebase status |

---

## Next Steps

1. Review [CAPSULE_API.md](./CAPSULE_API.md) for complete endpoint documentation
2. Implement CapsuleForm component
3. Implement CapsuleViewer component with unlock logic
4. Implement Dashboard with filtering and pagination
5. Add countdown timer component
6. Style components with Tailwind CSS
7. Add loading states and error messages
8. Test with Firebase Emulator

**Backend is ready - let's build the UI!**
