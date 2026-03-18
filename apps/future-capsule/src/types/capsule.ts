export type Mood = 'Happy' | 'Motivated' | 'Confused' | 'Sad' | 'Grateful' | 'Hopeful';

export type CapsuleStatus = 'draft' | 'scheduled' | 'unlocked' | 'archived';

export interface Capsule {
  id: string;
  userId: string;
  title: string;
  message: string;
  mood: Mood;
  unlockDate: number;
  photoURL?: string;
  createdAt: number;
  updatedAt: number;
  status: CapsuleStatus;
  isDeleted: boolean;
  isUnlocked?: boolean; // Computed, not stored
  daysUntilUnlock?: number; // Computed, not stored
  canEdit?: boolean;
}

export interface CapsuleListItem extends Omit<Capsule, 'message'> {
  message?: string;
}

export interface CreateCapsuleInput {
  title: string;
  message: string;
  mood: Mood;
  unlockDate: number;
  photoURL?: string;
}

export interface CapsuleCategory {
  locked: Capsule[];
  openingSoon: Capsule[];
  opened: Capsule[];
}

export const MOOD_EMOJIS: Record<Mood, string> = {
  Happy: '😄',
  Motivated: '💪',
  Confused: '🤔',
  Sad: '😢',
  Grateful: '🙏',
  Hopeful: '🌟',
};

export const MOOD_LABELS: Record<Mood, string> = {
  Happy: 'Happy',
  Motivated: 'Motivated',
  Confused: 'Confused',
  Sad: 'Sad',
  Grateful: 'Grateful',
  Hopeful: 'Hopeful',
};
