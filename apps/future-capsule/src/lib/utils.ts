import { differenceInDays, differenceInHours, differenceInMinutes, format, isPast } from 'date-fns';
import { Capsule, CapsuleCategory, MOOD_EMOJIS } from '../types/capsule';

export function formatDate(timestamp: number | string | null | undefined): string {
  if (!timestamp) return 'N/A';
  try {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, 'MMM d, yyyy');
  } catch {
    return 'N/A';
  }
}

export function formatDateTime(timestamp: number | string | null | undefined): string {
  if (!timestamp) return 'N/A';
  try {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, 'MMM d, yyyy h:mm a');
  } catch {
    return 'N/A';
  }
}

export interface CountdownTime {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isUnlocked: boolean;
}

export function calculateCountdown(unlockDate: number): CountdownTime {
  const now = new Date();
  const unlock = new Date(unlockDate);

  if (isPast(unlock)) {
    return {
      years: 0,
      months: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isUnlocked: true,
    };
  }

  let years = 0;
  let months = 0;
  let days = differenceInDays(unlock, now);

  if (days >= 365) {
    years = Math.floor(days / 365);
    days = days % 365;
  }

  if (days >= 30) {
    months = Math.floor(days / 30);
    days = days % 30;
  }

  const hours = differenceInHours(unlock, now) % 24;
  const minutes = differenceInMinutes(unlock, now) % 60;

  // Calculate seconds for display (even though we won't update them frequently)
  const totalSeconds = Math.floor((unlock.getTime() - now.getTime()) / 1000);
  const seconds = totalSeconds % 60;

  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    isUnlocked: false,
  };
}

export function formatCountdown(countdown: CountdownTime): string {
  if (countdown.isUnlocked) {
    return 'Ready to open!';
  }

  const parts: string[] = [];

  if (countdown.years > 0) {
    parts.push(`${countdown.years}y`);
  }
  if (countdown.months > 0) {
    parts.push(`${countdown.months}m`);
  }
  if (countdown.days > 0) {
    parts.push(`${countdown.days}d`);
  }
  if (countdown.hours > 0 || parts.length > 0) {
    parts.push(`${countdown.hours}h`);
  }
  if (countdown.minutes > 0 || parts.length > 1) {
    parts.push(`${countdown.minutes}min`);
  }

  return `Opens in ${parts.join(' ')}`;
}

export function categorizeCapsules(capsules: (Capsule | any)[]): CapsuleCategory {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const locked: any[] = [];
  const openingSoon: any[] = [];
  const opened: any[] = [];

  capsules.forEach((capsule) => {
    const unlockDate = new Date(capsule.unlockDate);
    if (unlockDate <= now) {
      opened.push(capsule);
    } else if (unlockDate <= sevenDaysFromNow) {
      openingSoon.push(capsule);
    } else {
      locked.push(capsule);
    }
  });

  // Sort each category by unlockDate
  locked.sort((a, b) => a.unlockDate - b.unlockDate);
  openingSoon.sort((a, b) => a.unlockDate - b.unlockDate);
  opened.sort((a, b) => b.unlockDate - a.unlockDate); // Newest first

  return { locked, openingSoon, opened };
}

export function isWithin24Hours(unlockDate: number): boolean {
  const now = new Date();
  const unlock = new Date(unlockDate);
  const hoursUntil = differenceInHours(unlock, now);
  return hoursUntil > 0 && hoursUntil <= 24;
}

export function formatShareUrl(capsuleId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/capsule/${capsuleId}`;
  }
  return `/capsule/${capsuleId}`;
}

export { MOOD_EMOJIS };
