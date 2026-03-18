/**
 * Capsule Unlock Validation Module
 *
 * Handles all unlock date validation, content filtering, and countdown calculations.
 * Server-side only validation - this logic runs on the backend to prevent client bypassing.
 */

import { Capsule, Mood } from '../types';

/**
 * Determines if a capsule can be read based on unlock date
 * Server-side validation - critical for security
 */
export function canReadCapsule(
  capsule: Capsule,
  userId: string,
  currentDate: Date = new Date()
): boolean {
  // Security: Only owner can read
  if (capsule.userId !== userId) {
    return false;
  }

  // Check if capsule is deleted
  if (capsule.isDeleted) {
    return false;
  }

  // Check if unlock date has passed
  const unlockTime = new Date(capsule.unlockDate).getTime();
  const currentTime = currentDate.getTime();

  return currentTime >= unlockTime;
}

/**
 * Returns filtered capsule content based on unlock status
 * For locked capsules: returns only metadata and countdown
 * For unlocked capsules: returns full content
 */
export function getReadableContent(
  capsule: Capsule,
  userId: string,
  currentDate: Date = new Date()
): Partial<Capsule> & {
  isUnlocked: boolean;
  canEdit: boolean;
  timeUntilUnlock?: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
} {
  const isUnlocked = canReadCapsule(capsule, userId, currentDate);

  // Base response available for all capsules
  const baseResponse = {
    id: capsule.id,
    userId: capsule.userId,
    title: capsule.title,
    mood: capsule.mood,
    unlockDate: capsule.unlockDate,
    photoURL: capsule.photoURL,
    createdAt: capsule.createdAt,
    updatedAt: capsule.updatedAt,
    isUnlocked,
    // Users can only edit before unlock date
    canEdit: capsule.userId === userId && !isUnlocked && !capsule.isDeleted,
  };

  if (isUnlocked) {
    // Return full content for unlocked capsules
    return {
      ...baseResponse,
      message: capsule.message,
      status: capsule.status,
      isDeleted: capsule.isDeleted,
    };
  }

  // For locked capsules, add countdown but no message content
  return {
    ...baseResponse,
    timeUntilUnlock: timeUntilUnlock(capsule.unlockDate, currentDate),
  };
}

/**
 * Calculates time remaining until capsule unlocks
 * Returns object with days, hours, minutes, seconds
 */
export function timeUntilUnlock(
  unlockDate: string | number | Date,
  currentDate: Date = new Date()
): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const unlockTime = new Date(unlockDate).getTime();
  const currentTime = currentDate.getTime();

  // If already unlocked, return zeroes
  if (currentTime >= unlockTime) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const diffMs = unlockTime - currentTime;

  // Calculate time units
  const totalSeconds = Math.floor(diffMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  const days = totalDays;
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

/**
 * Determines capsule status based on the current date
 * Used for filtering and display purposes
 */
export function getCapsuleStatus(
  capsule: Capsule,
  currentDate: Date = new Date()
): 'locked' | 'opening-soon' | 'unlocked' | 'deleted' {
  if (capsule.isDeleted) {
    return 'deleted';
  }

  const unlockTime = new Date(capsule.unlockDate).getTime();
  const currentTime = currentDate.getTime();
  const hourInMs = 60 * 60 * 1000;

  // Unlocked: current time >= unlock time
  if (currentTime >= unlockTime) {
    return 'unlocked';
  }

  // Opening soon: within 1 hour of unlock
  if (currentTime >= unlockTime - hourInMs) {
    return 'opening-soon';
  }

  // Locked
  return 'locked';
}

/**
 * Validates that unlock date is in the future
 * Server-side validation - prevents backdating
 */
export function isValidUnlockDate(
  unlockDate: string | number | Date,
  currentDate: Date = new Date()
): { valid: boolean; error?: string } {
  try {
    const unlockTime = new Date(unlockDate).getTime();
    const currentTime = currentDate.getTime();

    // Allow unlock date to be equal to current time (for immediate unlock)
    if (unlockTime < currentTime) {
      return {
        valid: false,
        error: 'Unlock date must be today or in the future',
      };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid unlock date format',
    };
  }
}

/**
 * Validates capsule data structure
 * Used before creating or updating a capsule
 */
export function validateCapsuleData(data: {
  title?: string;
  message?: string;
  mood?: string;
  unlockDate?: string | number | Date;
  photoURL?: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Validate title
  if (typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.title = 'Title is required';
  } else if (data.title.length > 255) {
    errors.title = 'Title must not exceed 255 characters';
  }

  // Validate message
  if (typeof data.message !== 'string' || data.message.trim().length === 0) {
    errors.message = 'Message is required';
  } else if (data.message.length > 50000) {
    errors.message = 'Message must not exceed 50,000 characters';
  }

  // Validate mood
  const validMoods: Mood[] = [
    'Happy',
    'Motivated',
    'Confused',
    'Sad',
    'Grateful',
    'Hopeful',
  ];
  if (!data.mood || !validMoods.includes(data.mood as Mood)) {
    errors.mood = `Mood must be one of: ${validMoods.join(', ')}`;
  }

  // Validate unlock date
  if (!data.unlockDate) {
    errors.unlockDate = 'Unlock date is required';
  } else {
    const dateValidation = isValidUnlockDate(data.unlockDate);
    if (!dateValidation.valid) {
      errors.unlockDate = dateValidation.error || 'Invalid unlock date';
    }
  }

  // Validate photoURL if provided
  if (data.photoURL) {
    try {
      new URL(data.photoURL);
    } catch {
      errors.photoURL = 'Photo URL must be a valid URL';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
