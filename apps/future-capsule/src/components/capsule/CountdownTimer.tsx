'use client';

import { CountdownTime } from '../../lib/utils';
import { motion } from 'framer-motion';
import { memo, useMemo } from 'react';
import { numberCounter, progressBar, fadeInUp } from '../../lib/animations';

interface CountdownTimerProps {
  countdown: CountdownTime;
  compact?: boolean;
  showProgressBar?: boolean;
  unlockDate?: number;
}

function CountdownTimerComponent({
  countdown,
  compact = false,
  showProgressBar = false,
  unlockDate,
}: CountdownTimerProps) {
  // Calculate progress for progress bar
  const progress = useMemo(() => {
    if (!unlockDate || countdown.isUnlocked) return 100;
    const now = Date.now();
    if (unlockDate <= now) return 100;

    // Assuming the capsule was created roughly 7 days before or we need a creation date
    // For now, use a relative approach: how much time has passed in proportional terms
    // This is a simplified version - ideally use createdAt timestamp

    return Math.min(100, Math.max(0, 100));
  }, [unlockDate, countdown]);

  const getUrgencyColor = () => {
    if (countdown.isUnlocked) {
      return {
        badge: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
        text: 'text-green-700 dark:text-green-300',
        bar: 'bg-green-500',
        title: 'text-green-600 dark:text-green-400',
      };
    }

    const totalDays = countdown.years * 365 + countdown.months * 30 + countdown.days;
    if (totalDays <= 7) {
      return {
        badge: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
        text: 'text-yellow-700 dark:text-yellow-300',
        bar: 'bg-yellow-500',
        title: 'text-yellow-600 dark:text-yellow-400',
      };
    }

    if (totalDays <= 30) {
      return {
        badge: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
        text: 'text-blue-700 dark:text-blue-300',
        bar: 'bg-blue-500',
        title: 'text-blue-600 dark:text-blue-400',
      };
    }

    return {
      badge: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
      text: 'text-purple-700 dark:text-purple-300',
      bar: 'bg-purple-500',
      title: 'text-purple-600 dark:text-purple-400',
    };
  };

  const getStatus = () => {
    if (countdown.isUnlocked) return 'Unlocked';
    const totalDays = countdown.years * 365 + countdown.months * 30 + countdown.days;
    if (totalDays <= 7) return 'Opening soon';
    return 'Locked';
  };

  const formatCountdownText = () => {
    if (countdown.isUnlocked) {
      return 'Your message is ready to open!';
    }

    const parts: string[] = [];

    if (countdown.years > 0) {
      parts.push(`${countdown.years} year${countdown.years > 1 ? 's' : ''}`);
    }
    if (countdown.months > 0) {
      parts.push(`${countdown.months} month${countdown.months > 1 ? 's' : ''}`);
    }
    if (countdown.days > 0) {
      parts.push(`${countdown.days} day${countdown.days > 1 ? 's' : ''}`);
    }
    if (countdown.hours > 0 || parts.length > 0) {
      parts.push(`${countdown.hours} hour${countdown.hours > 1 ? 's' : ''}`);
    }
    if (countdown.minutes > 0 || parts.length > 1) {
      parts.push(`${countdown.minutes} minute${countdown.minutes > 1 ? 's' : ''}`);
    }

    return `Opens in ${parts.join(', ')}`;
  };

  const urgency = getUrgencyColor();
  const status = getStatus();

  if (compact) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`text-sm font-medium ${urgency.title}`}
      >
        {countdown.isUnlocked ? '🎉 Unlocked' : formatCountdownText()}
      </motion.p>
    );
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className={`inline-flex items-center px-4 py-2 rounded-full font-semibold border-2 ${urgency.badge} ${urgency.text}`}
        >
          {countdown.isUnlocked ? (
            <>
              <span className="mr-2">🎉</span>
              {status}
            </>
          ) : countdown.days <= 7 ? (
            <>
              <span className="mr-2">⏰</span>
              {status}
            </>
          ) : (
            <>
              <span className="mr-2">🔒</span>
              {status}
            </>
          )}
        </motion.div>

        {showProgressBar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            {progress.toFixed(0)}%
          </motion.div>
        )}
      </div>

      {/* Progress Bar */}
      {showProgressBar && (
        <motion.div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <motion.div
            variants={progressBar}
            initial="hidden"
            animate="visible"
            style={{ width: `${progress}%` }}
            className={`h-full rounded-full origin-left ${urgency.bar}`}
          />
        </motion.div>
      )}

      {/* Countdown Display */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
      >
        {countdown.years > 0 && (
          <CountdownUnit label="Years" value={countdown.years} />
        )}
        {countdown.months > 0 && (
          <CountdownUnit label="Months" value={countdown.months} />
        )}
        <CountdownUnit label="Days" value={countdown.days} />
        <CountdownUnit label="Hours" value={countdown.hours} />
        <CountdownUnit label="Minutes" value={countdown.minutes} />
        {countdown.seconds > 0 && (
          <CountdownUnit label="Seconds" value={countdown.seconds} />
        )}
      </motion.div>

      {/* Message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center text-base text-gray-700 dark:text-gray-300 font-medium"
      >
        {formatCountdownText()}
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center text-sm text-gray-500 dark:text-gray-400 italic"
      >
        ✨ Your message is waiting in the future...
      </motion.p>
    </motion.div>
  );
}

function CountdownUnit({ label, value }: { label: string; value: number }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 dark:from-purple-600 dark:via-blue-600 dark:to-cyan-600 rounded-lg p-3 text-white text-center shadow-lg"
    >
      <motion.div
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="text-2xl sm:text-3xl font-bold font-mono"
      >
        {String(value).padStart(2, '0')}
      </motion.div>
      <p className="text-xs font-medium opacity-90 mt-1">{label}</p>
    </motion.div>
  );
}

export const CountdownTimer = memo(CountdownTimerComponent);
