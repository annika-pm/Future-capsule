/**
 * Centralized TypeScript Type Definitions for FutureCapsule
 * 
 * This file exports all types used throughout the application for consistency
 * and easier imports across components, pages, and utilities.
 */

// User & Auth Types
export type { User, AuthState } from './user';

// Capsule Types
export type {
  Mood,
  CapsuleStatus,
  Capsule,
  CapsuleListItem,
  CapsuleCategory,
  CreateCapsuleInput,
} from './capsule';

// Mood Statistics Types
export type {
  MoodStats,
  TimelineStats,
  MoodInsights,
  MoodCardProps,
} from './mood-stats';

// Re-export enums and constants
export { MOOD_EMOJIS, MOOD_LABELS } from './capsule';
