'use client';

import { useEffect, useState, useCallback } from 'react';
import { CountdownTime, calculateCountdown } from '../lib/utils';

export function useCountdown(unlockDate: number | null | undefined) {
  const [countdown, setCountdown] = useState<CountdownTime | null>(null);

  const updateCountdown = useCallback(() => {
    if (!unlockDate) return;
    setCountdown(calculateCountdown(unlockDate));
  }, [unlockDate]);

  useEffect(() => {
    // Update immediately on mount
    updateCountdown();

    // Update every second for real-time countdown
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [updateCountdown]);

  return countdown;
}
