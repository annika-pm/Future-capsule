import { Capsule, CreateCapsuleInput, CapsuleListItem } from '../types/capsule';

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

async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      },
    });

    if (response.status === 401) {
      // Token might be expired or user not authenticated
      throw new Error('Authentication failed');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `API error: ${response.status}`);
    }

    return data.data as T;
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

export const apiClient = {
  // Capsules
  createCapsule: (input: CreateCapsuleInput) =>
    apiCall<Capsule>('/capsules', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  getCapsules: (
    params?: Partial<{
      status: string;
      sortBy: 'unlockDate' | 'createdAt';
      order: 'asc' | 'desc';
      limit: number;
      offset: number;
    }>
  ) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, String(value));
        }
      });
    }
    return apiCall<CapsuleListResponse>(`/capsules?${query.toString()}`);
  },

  getCapsule: (id: string) =>
    apiCall<Capsule>(`/capsules/${id}`),

  updateCapsule: (id: string, updates: Partial<CreateCapsuleInput>) =>
    apiCall<Capsule>(`/capsules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  deleteCapsule: (id: string) =>
    apiCall(`/capsules/${id}`, {
      method: 'DELETE',
    }),
};
