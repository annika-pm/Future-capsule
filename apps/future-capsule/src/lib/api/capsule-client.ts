/**
 * Dedicated Capsule API Client
 * Handles all capsule-related API calls with proper error handling,
 * retry logic, and type safety.
 */

import { Capsule, CreateCapsuleInput, CapsuleListItem } from '../../types/capsule';
import { getAuthToken } from '../auth';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: unknown;
}

export interface CapsuleListResponse {
  capsules: CapsuleListItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface CapsuleFilters {
  status?: 'locked' | 'unlocked' | 'scheduled' | 'archived';
  sortBy?: 'unlockDate' | 'createdAt';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Generic API call wrapper with retry logic and error handling
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 1
): Promise<T> {
  try {
    // Get authentication token
    let authToken: string | null = null;
    try {
      authToken = await getAuthToken();
    } catch (err) {
      throw new Error('Authentication required. Please log in first.');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers,
    });

    // Handle 401 - authentication required
    if (response.status === 401) {
      throw new Error('Authentication failed. Please log in again.');
    }

    // Handle 403 - forbidden
    if (response.status === 403) {
      throw new Error('You do not have permission to access this resource.');
    }

    const result = await response.json() as ApiResponse<T>;

    if (!response.ok) {
      const errorMessage =
        result.error ||
        result.message ||
        `Error: ${response.status}`;
      throw new Error(errorMessage);
    }

    return result.data as T;
  } catch (error) {
    let message = 'An unexpected error occurred';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      message = String((error as any).message);
    } else if (typeof error === 'string') {
      message = error;
    }
    console.error(`API call failed: ${endpoint}`, message);
    throw error;
  }
}

/**
 * Capsule API Client
 */
export const capsuleClient = {
  /**
   * Create a new capsule
   */
  createCapsule: async (input: CreateCapsuleInput): Promise<Capsule> => {
    if (!input.title?.trim()) {
      throw new Error('Title is required');
    }
    if (!input.message?.trim()) {
      throw new Error('Message is required');
    }
    if (input.title.length > 255) {
      throw new Error('Title must be 255 characters or less');
    }
    if (input.message.length > 50000) {
      throw new Error('Message must be 50,000 characters or less');
    }
    if (input.unlockDate <= Date.now()) {
      throw new Error('Unlock date must be in the future');
    }

    // Convert camelCase to snake_case for API
    const payload = {
      title: input.title.trim(),
      message: input.message.trim(),
      mood: input.mood,
      unlock_date: new Date(input.unlockDate).toISOString(),
      photo_url: input.photoURL || null,
    };

    return apiCall<Capsule>('/capsules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Get list of capsules with optional filtering
   */
  getCapsules: async (filters?: CapsuleFilters): Promise<CapsuleListResponse> => {
    const query = new URLSearchParams();

    if (filters) {
      if (filters.status) query.append('status', filters.status);
      if (filters.sortBy) query.append('sortBy', filters.sortBy);
      if (filters.order) query.append('order', filters.order);
      if (filters.limit) query.append('limit', String(filters.limit));
      if (filters.offset) query.append('offset', String(filters.offset));
    }

    const queryString = query.toString();
    const endpoint = queryString ? `/capsules?${queryString}` : '/capsules';

    return apiCall<CapsuleListResponse>(endpoint);
  },

  /**
   * Get a single capsule by ID
   */
  getCapsule: async (id: string): Promise<Capsule> => {
    if (!id) {
      throw new Error('Capsule ID is required');
    }
    return apiCall<Capsule>(`/capsules/${id}`);
  },

  /**
   * Update a capsule
   */
  updateCapsule: async (id: string, updates: Partial<CreateCapsuleInput>): Promise<Capsule> => {
    if (!id) {
      throw new Error('Capsule ID is required');
    }
    if (Object.keys(updates).length === 0) {
      throw new Error('No updates provided');
    }

    return apiCall<Capsule>(`/capsules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Delete a capsule
   */
  deleteCapsule: async (id: string): Promise<void> => {
    if (!id) {
      throw new Error('Capsule ID is required');
    }

    await apiCall<void>(`/capsules/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Upload a photo for a capsule
   */
  uploadPhotoURL: async (file: File): Promise<string> => {
    if (!file) {
      throw new Error('File is required');
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeBytes) {
      throw new Error('File size must be less than 5MB');
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, WebP, and GIF images are supported');
    }

    const formData = new FormData();
    formData.append('file', file);

    const token = await getAuthToken();
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const result = await response.json() as ApiResponse<unknown>;
      throw new Error(result.error || 'Failed to upload image');
    }

    const result = await response.json() as ApiResponse<{ url: string }>;
    if (!result.data?.url) {
      throw new Error('No URL returned from upload');
    }

    return result.data.url;
  },
};

export default capsuleClient;
