'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface Capsule {
  id: string;
  user_id: string;
  title: string;
  message: string;
  mood: string;
  unlock_date: string;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  isLocked: boolean;
}

export interface CapsuleFilters {
  status?: 'locked' | 'unlocked' | 'scheduled' | 'archived';
  sortBy?: 'unlockDate' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface UseCapsuleListOptions extends CapsuleFilters {
  limit?: number;
  autoRefreshInterval?: number; // milliseconds, 0 = disabled
}

/**
 * Hook for fetching and managing a list of capsules
 */
export function useCapsules(options?: UseCapsuleListOptions) {
  const { user, session, isLoading: userLoading } = useAuth();
  const [capsules, setCapsules] = useState<Capsule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: options?.limit || 50,
    offset: 0,
    hasMore: false,
  });

  const fetchCapsules = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: String(options?.limit || 50),
        ...(options?.status && { status: options.status }),
        ...(options?.sortBy && { sortBy: options.sortBy }),
        ...(options?.order && { order: options.order }),
      });

      const response = await fetch(`/api/capsules?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch capsules: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform API response to match expected Capsule type
      const transformedCapsules = (data.capsules || []).map((capsule: any) => ({
        id: capsule.id,
        userId: capsule.user_id,
        title: capsule.title,
        message: capsule.message,
        mood: capsule.mood,
        unlockDate: new Date(capsule.unlock_date).getTime(),
        photoURL: capsule.photo_url,
        createdAt: new Date(capsule.created_at).getTime(),
        updatedAt: new Date(capsule.updated_at).getTime(),
        status: capsule.status || 'scheduled',
        isDeleted: false,
        isUnlocked: new Date(capsule.unlock_date) <= new Date(),
      }));
      
      setCapsules(transformedCapsules);
      setPagination(data.pagination || {});
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch capsules';
      setError(message);
      console.error('Failed to fetch capsules:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, options]);

  // Fetch on mount and when user/options change
  useEffect(() => {
    if (!userLoading) {
      fetchCapsules();
    }
  }, [fetchCapsules, userLoading]);

  // Auto-refresh interval
  useEffect(() => {
    if (!options?.autoRefreshInterval || options.autoRefreshInterval <= 0) return;

    const interval = setInterval(fetchCapsules, options.autoRefreshInterval);
    return () => clearInterval(interval);
  }, [fetchCapsules, options?.autoRefreshInterval]);

  const refetch = useCallback(async () => {
    await fetchCapsules();
  }, [fetchCapsules]);

  return {
    capsules,
    isLoading,
    error,
    pagination,
    refetch,
  };
}

/**
 * Hook for fetching a single capsule
 */
export function useCapsule(id: string) {
  const { user, session, isLoading: userLoading } = useAuth();
  const [capsule, setCapsule] = useState<Capsule | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCapsule = useCallback(async () => {
    if (!user || !id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/capsules/${id}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch capsule: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw API response:', data); // Debug log
      
      // Helper function to safely convert dates to ISO string
      const toDateString = (dateStr: any): string => {
        if (!dateStr) return new Date().toISOString();
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
      };
      
      // Transform API response to match expected Capsule type
      const transformedCapsule: Capsule = {
        id: data.data?.id || data.id,
        user_id: data.data?.user_id || data.user_id,
        title: data.data?.title || data.title,
        message: data.data?.message || data.message,
        mood: data.data?.mood || data.mood,
        unlock_date: toDateString(data.data?.unlock_date || data.unlock_date),
        photo_url: data.data?.photo_url || data.photo_url,
        created_at: toDateString(data.data?.created_at || data.created_at),
        updated_at: toDateString(data.data?.updated_at || data.updated_at),
        isLocked: data.data?.isLocked === true || data.isLocked === true,
      };
      
      console.log('Transformed capsule:', transformedCapsule); // Debug log
      setCapsule(transformedCapsule);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch capsule';
      setError(message);
      console.error('Failed to fetch capsule:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, session, id]);

  useEffect(() => {
    if (!userLoading) {
      fetchCapsule();
    }
  }, [fetchCapsule, userLoading]);

  return {
    capsule,
    isLoading,
    error,
    refetch: fetchCapsule,
  };
}

/**
 * Hook for creating, updating, and deleting capsules
 */
export function useCapsuleMutations(user_id?: string) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCapsule = useCallback(
    async (data: Omit<Capsule, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'isLocked'>) => {
      if (!user) throw new Error('User not authenticated');

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/capsules', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.id}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`Failed to create capsule: ${response.statusText}`);
        }

        return await response.json();
      } catch (err: any) {
        const message = err.message || 'Failed to create capsule';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const updateCapsule = useCallback(
    async (id: string, updates: Partial<Capsule>) => {
      if (!user) throw new Error('User not authenticated');

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/capsules/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${user.id}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update capsule: ${response.statusText}`);
        }

        return await response.json();
      } catch (err: any) {
        const message = err.message || 'Failed to update capsule';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const deleteCapsule = useCallback(
    async (id: string) => {
      if (!user) throw new Error('User not authenticated');

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/capsules/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.id}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to delete capsule: ${response.statusText}`);
        }
      } catch (err: any) {
        const message = err.message || 'Failed to delete capsule';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  return {
    createCapsule,
    updateCapsule,
    deleteCapsule,
    isLoading,
    error,
  };
}
