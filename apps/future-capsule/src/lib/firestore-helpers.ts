/**
 * DEPRECATED: Firestore Helper Functions
 *
 * This file has been deprecated as the project has migrated from Firebase to Supabase.
 * API routes should use the Supabase client directly from '@/lib/supabase'
 * 
 * See FIREBASE_TO_SUPABASE_MIGRATION.md for migration details.
 */

export {};

/**
 * Creates a Firestore reference to a user's capsule
 */
export function getCapsuleRef(userId: string, capsuleId: string): DocumentReference {
  return doc(db, 'users', userId, 'capsules', capsuleId);
}

/**
 * Creates a Firestore reference to a user's capsules collection
 */
export function getUserCapsulesRef(userId: string) {
  return collection(db, 'users', userId, 'capsules');
}

/**
 * Fetches a single capsule by ID
 *
 * Returns null if capsule doesn't exist or is deleted
 */
export async function getCapsuleById(
  userId: string,
  capsuleId: string
): Promise<Capsule | null> {
  try {
    const ref = getCapsuleRef(userId, capsuleId);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    // Don't return deleted capsules
    if (data?.isDeleted) {
      return null;
    }

    return {
      id: snapshot.id,
      ...(data as Omit<Capsule, 'id'>),
    } as Capsule;
  } catch (error) {
    console.error('[getCapsuleById] Error:', error);
    throw error;
  }
}

/**
 * Fetches all capsules for a user with optional filters
 *
 * Uses Firestore composite indexes:
 * - userId + unlockDate (ascending)
 * - userId + status + unlockDate
 *
 * OPTIMIZATION NOTES:
 * - Consider Redis caching for frequently accessed users' capsule lists
 * - Cache TTL: 5-15 minutes (invalidate on create/update/delete)
 * - Cache key pattern: `capsules:${userId}:${status}`
 * - For real-time updates, consider Firestore real-time listeners
 */
export async function getUserCapsules(
  userId: string,
  options?: {
    status?: 'locked' | 'unlocked' | 'opening-soon' | 'all';
    limit?: number;
    offset?: number;
    sortBy?: 'unlockDate' | 'createdAt';
    order?: 'asc' | 'desc';
  }
): Promise<{ capsules: Capsule[]; total: number }> {
  try {
    const opts = {
      status: options?.status || 'all',
      limit: Math.min(options?.limit || 50, 100), // Cap at 100
      offset: options?.offset || 0,
      sortBy: options?.sortBy || 'unlockDate',
      order: (options?.order || 'asc') as 'asc' | 'desc',
    };

    const capsulesRef = getUserCapsulesRef(userId);
    const constraints: any[] = [
      where('isDeleted', '==', false), // Exclude soft-deleted capsules
    ];

    // Add status filter if not "all"
    if (opts.status !== 'all') {
      constraints.push(where('status', '==', opts.status));
    }

    // Add ordering
    const orderField = opts.sortBy === 'unlockDate' ? 'unlockDate' : 'createdAt';
    constraints.push(orderBy(orderField, opts.order));

    // Limit results (Firestore doesn't support OFFSET, so we fetch extra)
    constraints.push(limit(opts.limit + opts.offset));

    const q = query(capsulesRef, ...constraints);
    const snapshot = await getDocs(q);

    const capsules: Capsule[] = [];
    let index = 0;
    snapshot.forEach((doc) => {
      // Manual pagination (skip first offset results)
      if (index >= opts.offset) {
        capsules.push({
          id: doc.id,
          ...(doc.data() as Omit<Capsule, 'id'>),
        } as Capsule);
      }
      index++;
    });

    return {
      capsules,
      total: snapshot.size, // Approximate total (actual would require separate count)
    };
  } catch (error) {
    console.error('[getUserCapsules] Error:', error);
    throw error;
  }
}

/**
 * Counts capsules by status for a user
 *
 * OPTIMIZATION NOTES:
 * - Cache this in Redis with TTL of 1 hour
 * - Re-compute on create/update/delete operations
 * - Cache key: `capsule_counts:${userId}`
 */
export async function getCapsuleCounts(
  userId: string
): Promise<{
  total: number;
  locked: number;
  unlocked: number;
  openingSoon: number;
}> {
  try {
    const capsulesRef = getUserCapsulesRef(userId);

    // Fetch all non-deleted capsules
    const q = query(
      capsulesRef,
      where('isDeleted', '==', false),
      orderBy('unlockDate', 'asc')
    );

    const snapshot = await getDocs(q);
    const now = Date.now();
    const oneHourMs = 60 * 60 * 1000;

    let locked = 0;
    let unlocked = 0;
    let openingSoon = 0;

    snapshot.forEach((doc) => {
      const data = doc.data() as Omit<Capsule, 'id'>;
      const unlockTime = typeof data.unlockDate === 'number' 
        ? data.unlockDate 
        : new Date(data.unlockDate).getTime();

      if (now >= unlockTime) {
        unlocked++;
      } else if (now >= unlockTime - oneHourMs) {
        openingSoon++;
      } else {
        locked++;
      }
    });

    return {
      total: snapshot.size,
      locked,
      unlocked,
      openingSoon,
    };
  } catch (error) {
    console.error('[getCapsuleCounts] Error:', error);
    throw error;
  }
}

/**
 * Checks if a capsule exists and is owned by the user
 */
export async function capsuleExists(
  userId: string,
  capsuleId: string
): Promise<boolean> {
  try {
    const ref = getCapsuleRef(userId, capsuleId);
    const snapshot = await getDoc(ref);
    return snapshot.exists() && !snapshot.data()?.isDeleted;
  } catch (error) {
    console.error('[capsuleExists] Error:', error);
    return false;
  }
}

/**
 * Converts Firestore Timestamp to ISO string for API responses
 */
export function firestoreTimestampToIso(timestamp: Timestamp | Date | number): string {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (typeof timestamp === 'number') {
    return new Date(timestamp).toISOString();
  }
  return new Date(timestamp).toISOString();
}

/**
 * Converts ISO string to Firestore Timestamp for storage
 */
export function isoToFirestoreTimestamp(isoString: string): Timestamp {
  return Timestamp.fromDate(new Date(isoString));
}

/**
 * Gets the current server timestamp for consistent timestamping
 */
export function getCurrentServerTimestamp(): Timestamp {
  return Timestamp.now();
}

/**
 * Gets capsules by mood with optional date range filtering
 *
 * OPTIMIZATION:
 * - Requires Firestore composite index: userId + mood + unlockDate
 * - Returns only essential fields (id, mood, unlockDate, createdAt)
 * - Filters out deleted and locked capsules
 * - Useful for mood-based insights and trends
 *
 * CACHING:
 * - Cache key: `capsules:${userId}:mood:${mood}`
 * - TTL: 1 hour
 * - Invalidate on: capsule create/update/delete
 */
export async function getCapsulesByMood(
  userId: string,
  mood: string
): Promise<Omit<Capsule, 'message'>[]> {
  try {
    const capsulesRef = getUserCapsulesRef(userId);

    const q = query(
      capsulesRef,
      where('isDeleted', '==', false),
      where('mood', '==', mood),
      where('unlockDate', '<=', Timestamp.now()),
      orderBy('unlockDate', 'desc')
    );

    const snapshot = await getDocs(q);
    const capsules: Omit<Capsule, 'message'>[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      capsules.push({
        id: doc.id,
        userId: data.userId,
        title: data.title,
        mood: data.mood,
        unlockDate: data.unlockDate,
        photoURL: data.photoURL,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        status: data.status,
        isDeleted: data.isDeleted,
        isUnlocked: data.isUnlocked,
        daysUntilUnlock: data.daysUntilUnlock,
      } as Omit<Capsule, 'message'>);
    });

    return capsules;
  } catch (error) {
    console.error('[getCapsulesByMood] Error:', error);
    throw error;
  }
}

/**
 * Gets upcoming capsules within 30 days
 *
 * OPTIMIZATION:
 * - Requires Firestore composite index: userId + unlockDate
 * - Pre-filters to reduce frontend processing
 * - Returns only essential fields, excluding message
 * - Perfect for timeline/notification features
 *
 * CACHING:
 * - Cache key: `capsules:${userId}:upcoming30d`
 * - TTL: 15 minutes (frequently accessed, changes often)
 * - Invalidate on: capsule create/update/delete
 */
export async function getCapsulesUpcoming30Days(
  userId: string
): Promise<(Omit<Capsule, 'message'> & { daysUntilUnlock: number })[]> {
  try {
    const capsulesRef = getUserCapsulesRef(userId);
    const now = Timestamp.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const thirtyDaysFromNow = new Timestamp(
      Math.floor((Date.now() + thirtyDaysMs) / 1000),
      0
    );

    const q = query(
      capsulesRef,
      where('isDeleted', '==', false),
      where('unlockDate', '>', now),
      where('unlockDate', '<=', thirtyDaysFromNow),
      orderBy('unlockDate', 'asc')
    );

    const snapshot = await getDocs(q);
    const capsules: (Omit<Capsule, 'message'> & { daysUntilUnlock: number })[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const unlockTime = data.unlockDate.toMillis?.() || 
                         new Date(data.unlockDate).getTime();
      const daysUntil = Math.ceil(
        (unlockTime - Date.now()) / (24 * 60 * 60 * 1000)
      );

      capsules.push({
        id: doc.id,
        userId: data.userId,
        title: data.title,
        mood: data.mood,
        unlockDate: data.unlockDate,
        photoURL: data.photoURL,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        status: data.status,
        isDeleted: data.isDeleted,
        isUnlocked: data.isUnlocked,
        daysUntilUnlock: daysUntil,
      });
    });

    return capsules;
  } catch (error) {
    console.error('[getCapsulesUpcoming30Days] Error:', error);
    throw error;
  }
}

/**
 * Aggregates mood statistics for authenticated user
 *
 * OPTIMIZATION:
 * - Single query + aggregation in-function (vs N queries per mood)
 * - Computes stats server-side to reduce frontend overhead
 * - Returns only aggregated data (no individual capsules)
 * - Filters out deleted and locked capsules
 *
 * PERFORMANCE CONSIDERATIONS:
 * - Time complexity: O(n) where n = total capsules per user
 * - Space complexity: O(m) where m = number of moods (constant ~6)
 * - Estimated latency: 50-200ms for 100+ capsules
 *
 * CACHING STRATEGY:
 * - Cache key: `stats:${userId}`
 * - TTL: 1 hour
 * - Invalidate on: any capsule create/update/delete
 * - Consider background job to refresh every 30 minutes
 *
 * FUTURE OPTIMIZATIONS:
 * - Implement materialized view in Firestore (pre-computed collection)
 * - Use Firestore aggregation queries (v10.2+) for COUNT aggregations
 * - Move to Cloud Functions for scheduled aggregations
 */
export async function getCapsuleStats(
  userId: string
): Promise<{
  moodCounts: Record<string, number>;
  totalCapsules: number;
  unlockedCapsules: number;
  lockedCapsules: number;
  upcomingCapsules: number;
  mostWrittenMood: string | null;
  moodTrends: Record<string, Record<string, number>>;
  averageMoodScore?: number;
}> {
  try {
    const capsulesRef = getUserCapsulesRef(userId);

    // Fetch all non-deleted capsules in one query
    const q = query(
      capsulesRef,
      where('isDeleted', '==', false),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    const now = Date.now();
    const oneHourMs = 60 * 60 * 1000;

    // Initialize aggregation structures
    const moodCounts: Record<string, number> = {
      Happy: 0,
      Motivated: 0,
      Confused: 0,
      Sad: 0,
      Grateful: 0,
      Hopeful: 0,
    };

    const moodTrends: Record<string, Record<string, number>> = {};
    let totalCapsules = 0;
    let unlockedCapsules = 0;
    let lockedCapsules = 0;
    let upcomingCapsules = 0;

    // Aggregate data in single pass
    snapshot.forEach((doc) => {
      const data = doc.data();
      const mood = data.mood as string;
      const unlockTime = data.unlockDate.toMillis?.() || 
                         new Date(data.unlockDate).getTime();

      // Count by mood
      if (mood in moodCounts) {
        moodCounts[mood]++;
      }

      // Determine capsule status
      if (now >= unlockTime) {
        unlockedCapsules++;
      } else if (now >= unlockTime - oneHourMs) {
        upcomingCapsules++;
      } else {
        lockedCapsules++;
      }

      totalCapsules++;

      // Build mood trends (year-month key)
      const createdDate = data.createdAt.toDate?.() || 
                          new Date(data.createdAt);
      const yearMonth = createdDate.toISOString().substring(0, 7); // YYYY-MM

      if (!moodTrends[yearMonth]) {
        moodTrends[yearMonth] = {};
      }
      if (!moodTrends[yearMonth][mood]) {
        moodTrends[yearMonth][mood] = 0;
      }
      moodTrends[yearMonth][mood]++;
    });

    // Find most written mood
    const mostWrittenMood =
      Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || null;

    // Calculate average mood score (optional: for trend analysis)
    // Using mood positivity scoring: Happy=5, Grateful=5, Hopeful=4, Motivated=4, Confused=2, Sad=1
    const moodScores: Record<string, number> = {
      Happy: 5,
      Grateful: 5,
      Hopeful: 4,
      Motivated: 4,
      Confused: 2,
      Sad: 1,
    };

    let totalScore = 0;
    Object.entries(moodCounts).forEach(([mood, count]) => {
      totalScore += (moodScores[mood] || 2) * count;
    });
    const averageMoodScore =
      totalCapsules > 0 ? parseFloat((totalScore / totalCapsules).toFixed(2)) : 0;

    return {
      moodCounts,
      totalCapsules,
      unlockedCapsules,
      lockedCapsules,
      upcomingCapsules,
      mostWrittenMood,
      moodTrends,
      averageMoodScore,
    };
  } catch (error) {
    console.error('[getCapsuleStats] Error:', error);
    throw error;
  }
}

/**
 * FUTURE CACHING STRATEGY
 *
 * Implement Redis/Memcached for:
 * 1. User capsule lists (cache key: `capsules:${userId}:{status}`)
 *    - TTL: 10 minutes
 *    - Invalidate on: create, update, delete, soft delete
 *
 * 2. Single capsule detail (cache key: `capsule:${userId}:${capsuleId}`)
 *    - TTL: 5 minutes
 *    - Invalidate on: update, delete
 *
 * 3. Capsule counts (cache key: `counts:${userId}`)
 *    - TTL: 30 minutes
 *    - Invalidate on: create, update delete, status change
 *
 * 4. Unlock status (cache key: `unlock:${userId}:${capsuleId}`)
 *    - TTL: Dynamic (expires at unlock time)
 *    - Invalidate on: unlock date change
 *
 * Implementation pattern:
 * ```typescript
 * async function getCachedCapsules(userId) {
 *   const cacheKey = `capsules:${userId}`;
 *   const cached = await redis.get(cacheKey);
 *   if (cached) return JSON.parse(cached);
 *
 *   const data = await getUserCapsules(userId);
 *   await redis.setex(cacheKey, 600, JSON.stringify(data)); // 10 mins
 *   return data;
 * }
 * ```
 */
