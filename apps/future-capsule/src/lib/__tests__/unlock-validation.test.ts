/**
 * Unit Tests for Capsule Unlock Validation
 * Tests unlock logic, content filtering, and countdown calculations
 */

import {
  canReadCapsule,
  getReadableContent,
  timeUntilUnlock,
  getCapsuleStatus,
  isValidUnlockDate,
  validateCapsuleData,
} from '@/lib/capsule-unlock';
import { Capsule } from '@/types';

const mockCapsule: Capsule = {
  id: 'capsule-1',
  userId: 'user-1',
  title: 'Test Capsule',
  message: 'Test message content',
  mood: 'Happy',
  unlockDate: '2025-12-31T00:00:00.000Z',
  photoURL: 'https://example.com/photo.jpg',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
  status: 'locked',
  isDeleted: false,
};

describe('canReadCapsule', () => {
  it('should allow owner to read unlocked capsule', () => {
    const currentDate = new Date('2025-12-31T00:00:01.000Z');
    const result = canReadCapsule(mockCapsule, 'user-1', currentDate);
    expect(result).toBe(true);
  });

  it('should prevent non-owner from reading any capsule', () => {
    const result = canReadCapsule(mockCapsule, 'user-2');
    expect(result).toBe(false);
  });

  it('should prevent reading locked capsule even for owner', () => {
    const currentDate = new Date('2025-12-30T00:00:00.000Z');
    const result = canReadCapsule(mockCapsule, 'user-1', currentDate);
    expect(result).toBe(false);
  });

  it('should prevent reading deleted capsule', () => {
    const deletedCapsule = { ...mockCapsule, isDeleted: true };
    const currentDate = new Date('2025-12-31T00:00:01.000Z');
    const result = canReadCapsule(deletedCapsule, 'user-1', currentDate);
    expect(result).toBe(false);
  });

  it('should allow reading when unlock time equals current time', () => {
    const currentDate = new Date('2025-12-31T00:00:00.000Z');
    const result = canReadCapsule(mockCapsule, 'user-1', currentDate);
    expect(result).toBe(true);
  });
});

describe('getReadableContent', () => {
  it('should return full content for unlocked capsule', () => {
    const currentDate = new Date('2025-12-31T00:00:01.000Z');
    const content = getReadableContent(mockCapsule, 'user-1', currentDate);

    expect(content).toHaveProperty('message', 'Test message content');
    expect(content).toHaveProperty('isUnlocked', true);
    expect(content).toHaveProperty('canEdit', false);
  });

  it('should exclude message for locked capsule', () => {
    const currentDate = new Date('2025-12-30T00:00:00.000Z');
    const content = getReadableContent(mockCapsule, 'user-1', currentDate);

    expect(content).not.toHaveProperty('message');
    expect(content).toHaveProperty('isUnlocked', false);
    expect(content).toHaveProperty('timeUntilUnlock');
  });

  it('should allow edit for locked capsule owned by user', () => {
    const currentDate = new Date('2025-12-30T00:00:00.000Z');
    const content = getReadableContent(mockCapsule, 'user-1', currentDate);

    expect(content.canEdit).toBe(true);
  });

  it('should prevent edit after unlock', () => {
    const currentDate = new Date('2025-12-31T00:00:01.000Z');
    const content = getReadableContent(mockCapsule, 'user-1', currentDate);

    expect(content.canEdit).toBe(false);
  });

  it('should include metadata in both locked and unlocked states', () => {
    const currentDate = new Date('2025-12-30T00:00:00.000Z');
    const content = getReadableContent(mockCapsule, 'user-1', currentDate);

    expect(content).toHaveProperty('id', 'capsule-1');
    expect(content).toHaveProperty('title', 'Test Capsule');
    expect(content).toHaveProperty('mood', 'Happy');
    expect(content).toHaveProperty('unlockDate');
  });
});

describe('timeUntilUnlock', () => {
  it('should calculate correct time remaining', () => {
    const unlockDate = '2025-01-05T12:00:00.000Z';
    const currentDate = new Date('2025-01-01T12:00:00.000Z');

    const result = timeUntilUnlock(unlockDate, currentDate);

    expect(result.days).toBe(4);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
  });

  it('should return zeros for already unlocked capsule', () => {
    const unlockDate = '2025-01-01T00:00:00.000Z';
    const currentDate = new Date('2025-01-02T00:00:00.000Z');

    const result = timeUntilUnlock(unlockDate, currentDate);

    expect(result.days).toBe(0);
    expect(result.hours).toBe(0);
    expect(result.minutes).toBe(0);
    expect(result.seconds).toBe(0);
  });

  it('should calculate hours, minutes, and seconds correctly', () => {
    const unlockDate = '2025-01-01T15:30:45.000Z';
    const currentDate = new Date('2025-01-01T10:20:30.000Z');

    const result = timeUntilUnlock(unlockDate, currentDate);

    expect(result.days).toBe(0);
    expect(result.hours).toBe(5);
    expect(result.minutes).toBe(10);
    expect(result.seconds).toBe(15);
  });

  it('should handle date objects, strings, and numbers', () => {
    const currentDate = new Date('2025-01-01T00:00:00.000Z');

    const fromString = timeUntilUnlock('2025-01-02T00:00:00.000Z', currentDate);
    const fromDate = timeUntilUnlock(new Date('2025-01-02T00:00:00.000Z'), currentDate);
    const fromNumber = timeUntilUnlock(new Date('2025-01-02T00:00:00.000Z').getTime(), currentDate);

    expect(fromString).toEqual(fromDate);
    expect(fromDate).toEqual(fromNumber);
  });
});

describe('getCapsuleStatus', () => {
  it('should return "deleted" for deleted capsule', () => {
    const capsule = { ...mockCapsule, isDeleted: true };
    const status = getCapsuleStatus(capsule);
    expect(status).toBe('deleted');
  });

  it('should return "unlocked" for capsule with past unlock date', () => {
    const capsule = { ...mockCapsule, unlockDate: '2025-01-01T00:00:00.000Z' };
    const currentDate = new Date('2025-01-02T00:00:00.000Z');
    const status = getCapsuleStatus(capsule, currentDate);
    expect(status).toBe('unlocked');
  });

  it('should return "opening-soon" for capsule within 1 hour of unlock', () => {
    const currentDate = new Date('2025-01-01T23:30:00.000Z');
    const capsule = { ...mockCapsule, unlockDate: '2025-01-02T00:00:00.000Z' };
    const status = getCapsuleStatus(capsule, currentDate);
    expect(status).toBe('opening-soon');
  });

  it('should return "locked" for capsule more than 1 hour away', () => {
    const currentDate = new Date('2025-01-01T22:00:00.000Z');
    const capsule = { ...mockCapsule, unlockDate: '2025-01-02T00:00:00.000Z' };
    const status = getCapsuleStatus(capsule, currentDate);
    expect(status).toBe('locked');
  });
});

describe('isValidUnlockDate', () => {
  it('should accept future unlock date', () => {
    const currentDate = new Date('2025-01-01T00:00:00.000Z');
    const result = isValidUnlockDate('2025-12-31T00:00:00.000Z', currentDate);
    expect(result.valid).toBe(true);
  });

  it('should accept current date as unlock date', () => {
    const currentDate = new Date('2025-01-01T00:00:00.000Z');
    const result = isValidUnlockDate('2025-01-01T00:00:00.000Z', currentDate);
    expect(result.valid).toBe(true);
  });

  it('should reject past unlock date', () => {
    const currentDate = new Date('2025-01-02T00:00:00.000Z');
    const result = isValidUnlockDate('2025-01-01T00:00:00.000Z', currentDate);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('must be today or in the future');
  });

  it('should reject invalid date format', () => {
    const result = isValidUnlockDate('not-a-date');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid unlock date format');
  });

  it('should handle various date formats', () => {
    const currentDate = new Date('2025-01-01T00:00:00.000Z');

    const fromString = isValidUnlockDate('2025-12-31T00:00:00.000Z', currentDate);
    const fromDate = isValidUnlockDate(new Date('2025-12-31T00:00:00.000Z'), currentDate);
    const fromTimestamp = isValidUnlockDate(1767139200000, currentDate);

    expect(fromString.valid).toBe(true);
    expect(fromDate.valid).toBe(true);
    expect(fromTimestamp.valid).toBe(true);
  });
});

describe('validateCapsuleData', () => {
  const validData = {
    title: 'Valid Title',
    message: 'Valid message content',
    mood: 'Happy' as const,
    unlockDate: '2025-12-31T00:00:00.000Z',
    photoURL: 'https://example.com/photo.jpg',
  };

  it('should accept valid capsule data', () => {
    const result = validateCapsuleData(validData);
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('should reject missing title', () => {
    const data = { ...validData, title: '' };
    const result = validateCapsuleData(data);
    expect(result.valid).toBe(false);
    expect(result.errors.title).toBeDefined();
  });

  it('should reject title exceeding 255 characters', () => {
    const data = { ...validData, title: 'a'.repeat(256) };
    const result = validateCapsuleData(data);
    expect(result.valid).toBe(false);
    expect(result.errors.title).toContain('must not exceed 255');
  });

  it('should reject missing message', () => {
    const data = { ...validData, message: '' };
    const result = validateCapsuleData(data);
    expect(result.valid).toBe(false);
    expect(result.errors.message).toBeDefined();
  });

  it('should reject message exceeding 50,000 characters', () => {
    const data = { ...validData, message: 'a'.repeat(50001) };
    const result = validateCapsuleData(data);
    expect(result.valid).toBe(false);
    expect(result.errors.message).toContain('must not exceed 50,000');
  });

  it('should reject invalid mood', () => {
    const data = { ...validData, mood: 'InvalidMood' };
    const result = validateCapsuleData(data);
    expect(result.valid).toBe(false);
    expect(result.errors.mood).toBeDefined();
  });

  it('should accept all valid moods', () => {
    const validMoods = ['Happy', 'Motivated', 'Confused', 'Sad', 'Grateful', 'Hopeful'] as const;
    validMoods.forEach((mood) => {
      const data = { ...validData, mood };
      const result = validateCapsuleData(data);
      expect(result.valid).toBe(true);
    });
  });

  it('should reject missing unlock date', () => {
    const data = { ...validData, unlockDate: undefined };
    const result = validateCapsuleData(data);
    expect(result.valid).toBe(false);
    expect(result.errors.unlockDate).toBeDefined();
  });

  it('should reject past unlock date', () => {
    const data = { ...validData, unlockDate: '2020-01-01T00:00:00.000Z' };
    const result = validateCapsuleData(data);
    expect(result.valid).toBe(false);
    expect(result.errors.unlockDate).toBeDefined();
  });

  it('should reject invalid photo URL', () => {
    const data = { ...validData, photoURL: 'not-a-url' };
    const result = validateCapsuleData(data);
    expect(result.valid).toBe(false);
    expect(result.errors.photoURL).toBeDefined();
  });

  it('should accept data without optional photoURL', () => {
    const data = { ...validData };
    delete (data as any).photoURL;
    const result = validateCapsuleData(data);
    expect(result.valid).toBe(true);
  });

  it('should report all validation errors together', () => {
    const data = {
      title: '',
      message: '',
      mood: 'InvalidMood',
      unlockDate: '2020-01-01T00:00:00.000Z',
    };
    const result = validateCapsuleData(data);
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).length).toBeGreaterThan(1);
  });
});
