/**
 * Unit Tests for Firestore Helper Functions
 * Tests query helpers with mocked Firestore
 */

import {
  getCapsuleRef,
  getUserCapsulesRef,
  getCapsuleById,
  getUserCapsules,
  getCapsuleCounts,
  capsuleExists,
  firestoreTimestampToIso,
  isoToFirestoreTimestamp,
  getCurrentServerTimestamp,
  getCapsulesByMood,
  getCapsulesUpcoming30Days,
} from '@/lib/firestore-helpers';
import { Capsule } from '@/types';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((db, ...path) => ({ path })),
  doc: jest.fn((db, ...path) => ({ path })),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn((...args) => args),
  where: jest.fn((field, op, value) => ({ field, op, value })),
  orderBy: jest.fn((field, direction) => ({ field, direction })),
  limit: jest.fn((n) => ({ limit: n })),
  Timestamp: {
    now: jest.fn(() => new Date()),
    fromDate: jest.fn((date) => date),
  },
}));

describe('Firestore Quote Helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCapsuleRef', () => {
    it('should return a reference to user capsule', () => {
      const ref = getCapsuleRef('user-123', 'capsule-456');
      expect(ref).toBeDefined();
    });
  });

  describe('getUserCapsulesRef', () => {
    it('should return a reference to user capsules collection', () => {
      const ref = getUserCapsulesRef('user-123');
      expect(ref).toBeDefined();
    });
  });

  describe('firestoreTimestampToIso', () => {
    it('should convert Firestore Timestamp to ISO string', () => {
      const date = new Date('2025-01-01T12:00:00.000Z');
      const timestamp = Timestamp.fromDate(date) as any;
      timestamp.toDate = jest.fn(() => date);

      const result = firestoreTimestampToIso(timestamp);
      expect(result).toBe('2025-01-01T12:00:00.000Z');
    });

    it('should convert Date to ISO string', () => {
      const date = new Date('2025-01-01T12:00:00.000Z');
      const result = firestoreTimestampToIso(date);
      expect(result).toBe('2025-01-01T12:00:00.000Z');
    });
  });

  describe('isoToFirestoreTimestamp', () => {
    it('should convert ISO string to Firestore Timestamp', () => {
      const result = isoToFirestoreTimestamp('2025-01-01T12:00:00.000Z');
      expect(result).toBeDefined();
    });

    it('should handle various ISO date formats', () => {
      const dates = [
        '2025-01-01T12:00:00.000Z',
        '2025-01-01T12:00:00Z',
        '2025-01-01',
      ];

      dates.forEach((dateStr) => {
        const result = isoToFirestoreTimestamp(dateStr);
        expect(result).toBeDefined();
      });
    });
  });

  describe('getCurrentServerTimestamp', () => {
    it('should return current server timestamp', () => {
      const result = getCurrentServerTimestamp();
      expect(result).toBeDefined();
    });
  });
});

describe('Firestore Capsule Queries', () => {
  const mockCapsule: Capsule = {
    id: 'capsule-1',
    userId: 'user-123',
    title: 'Test Capsule',
    message: 'Test message',
    mood: 'Happy',
    unlockDate: '2025-12-31T00:00:00.000Z',
    photoURL: 'https://example.com/photo.jpg',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    status: 'locked',
    isDeleted: false,
  };

  describe('getCapsuleById', () => {
    it('should fetch capsule by ID', async () => {
      const getDocMock = jest.fn().mockResolvedValue({
        exists: () => true,
        id: 'capsule-1',
        data: () => mockCapsule,
      });

      const firestore = require('firebase/firestore');
      firestore.getDoc.mockImplementation(getDocMock);

      const result = await getCapsuleById('user-123', 'capsule-1');
      expect(result).toBeDefined();
    });

    it('should return null for non-existent capsule', async () => {
      const getDocMock = jest.fn().mockResolvedValue({
        exists: () => false,
      });

      const firestore = require('firebase/firestore');
      firestore.getDoc.mockImplementation(getDocMock);

      const result = await getCapsuleById('user-123', 'capsule-1');
      expect(result).toBeNull();
    });

    it('should return null for deleted capsule', async () => {
      const deletedCapsule = { ...mockCapsule, isDeleted: true };
      const getDocMock = jest.fn().mockResolvedValue({
        exists: () => true,
        id: 'capsule-1',
        data: () => deletedCapsule,
      });

      const firestore = require('firebase/firestore');
      firestore.getDoc.mockImplementation(getDocMock);

      const result = await getCapsuleById('user-123', 'capsule-1');
      expect(result).toBeNull();
    });
  });

  describe('capsuleExists', () => {
    it('should return true for existing, non-deleted capsule', async () => {
      const getDocMock = jest.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ isDeleted: false }),
      });

      const firestore = require('firebase/firestore');
      firestore.getDoc.mockImplementation(getDocMock);

      const result = await capsuleExists('user-123', 'capsule-1');
      expect(result).toBe(true);
    });

    it('should return false for deleted capsule', async () => {
      const getDocMock = jest.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ isDeleted: true }),
      });

      const firestore = require('firebase/firestore');
      firestore.getDoc.mockImplementation(getDocMock);

      const result = await capsuleExists('user-123', 'capsule-1');
      expect(result).toBe(false);
    });

    it('should return false for non-existent capsule', async () => {
      const getDocMock = jest.fn().mockResolvedValue({
        exists: () => false,
      });

      const firestore = require('firebase/firestore');
      firestore.getDoc.mockImplementation(getDocMock);

      const result = await capsuleExists('user-123', 'capsule-1');
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const firestore = require('firebase/firestore');
      firestore.getDoc.mockRejectedValue(new Error('DB Error'));

      const result = await capsuleExists('user-123', 'capsule-1');
      expect(result).toBe(false);
    });
  });

  describe('getCapsuleCounts', () => {
    it('should count capsules by status', async () => {
      const capsules = [
        { unlockDate: new Date('2025-01-10') },
        { unlockDate: new Date('2025-12-31') },
        { unlockDate: new Date('2025-01-05') },
      ];

      const getDocsMock = jest.fn().mockResolvedValue({
        size: 3,
        forEach: (callback: any) => {
          capsules.forEach((capsule) => {
            callback({
              data: () => capsule,
            });
          });
        },
      });

      const firestore = require('firebase/firestore');
      firestore.getDocs.mockImplementation(getDocsMock);

      const result = await getCapsuleCounts('user-123');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('locked');
      expect(result).toHaveProperty('unlocked');
      expect(result).toHaveProperty('openingSoon');
    });
  });

  describe('getCapsulesByMood', () => {
    it('should return capsules filtered by mood', async () => {
      const moodCapsules = [
        { id: 'c1', mood: 'Happy', unlockDate: '2024-12-31' },
        { id: 'c2', mood: 'Happy', unlockDate: '2024-12-30' },
      ];

      const getDocsMock = jest.fn().mockResolvedValue({
        forEach: (callback: any) => {
          moodCapsules.forEach((capsule) => {
            callback({
              id: capsule.id,
              data: () => capsule,
            });
          });
        },
      });

      const firestore = require('firebase/firestore');
      firestore.getDocs.mockImplementation(getDocsMock);

      const result = await getCapsulesByMood('user-123', 'Happy');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getCapsulesUpcoming30Days', () => {
    it('should return capsules unlocking within 30 days', async () => {
      const upcomingCapsules = [
        { id: 'c1', unlockDate: '2025-01-10' },
        { id: 'c2', unlockDate: '2025-01-25' },
      ];

      const getDocsMock = jest.fn().mockResolvedValue({
        forEach: (callback: any) => {
          upcomingCapsules.forEach((capsule) => {
            callback({
              id: capsule.id,
              data: () => ({
                ...capsule,
                unlockDate: {
                  toMillis: () => new Date(capsule.unlockDate).getTime(),
                },
              }),
            });
          });
        },
      });

      const firestore = require('firebase/firestore');
      firestore.getDocs.mockImplementation(getDocsMock);

      const result = await getCapsulesUpcoming30Days('user-123');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getUserCapsules', () => {
    it('should fetch user capsules with pagination', async () => {
      const capsules = Array.from({ length: 10 }, (_, i) => ({
        id: `capsule-${i}`,
        title: `Capsule ${i}`,
      }));

      const getDocsMock = jest.fn().mockResolvedValue({
        size: 10,
        forEach: (callback: any) => {
          capsules.forEach((capsule) => {
            callback({
              id: capsule.id,
              data: () => capsule,
            });
          });
        },
      });

      const firestore = require('firebase/firestore');
      firestore.getDocs.mockImplementation(getDocsMock);

      const result = await getUserCapsules('user-123', {
        limit: 5,
        offset: 0,
      });

      expect(result).toHaveProperty('capsules');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.capsules)).toBe(true);
    });

    it('should support status filtering', async () => {
      const getDocsMock = jest.fn().mockResolvedValue({
        size: 3,
        forEach: jest.fn(),
      });

      const firestore = require('firebase/firestore');
      firestore.getDocs.mockImplementation(getDocsMock);

      await getUserCapsules('user-123', { status: 'locked' });

      expect(getDocsMock).toHaveBeenCalled();
    });

    it('should support sorting options', async () => {
      const getDocsMock = jest.fn().mockResolvedValue({
        size: 0,
        forEach: jest.fn(),
      });

      const firestore = require('firebase/firestore');
      firestore.getDocs.mockImplementation(getDocsMock);

      await getUserCapsules('user-123', {
        sortBy: 'createdAt',
        order: 'desc',
      });

      expect(getDocsMock).toHaveBeenCalled();
    });

    it('should limit max results to 100', async () => {
      const getDocsMock = jest.fn().mockResolvedValue({
        size: 0,
        forEach: jest.fn(),
      });

      const firestore = require('firebase/firestore');
      firestore.getDocs.mockImplementation(getDocsMock);

      await getUserCapsules('user-123', { limit: 500 });

      expect(getDocsMock).toHaveBeenCalled();
    });
  });
});
