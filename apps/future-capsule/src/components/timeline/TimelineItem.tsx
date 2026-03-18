'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '../shared/Card';
import { Badge } from '../shared/Badge';
import { Capsule, MOOD_EMOJIS } from '../../types/capsule';
import { formatDate } from '../../lib/utils';
import { timelineItemEntry, emojiPulse, cardHover } from '../../lib/animations';
import { CountdownTimer } from '../capsule/CountdownTimer';
import { useCountdown } from '../../hooks/useCountdown';

interface TimelineItemProps {
  capsule: Capsule;
  index: number;
}

export function TimelineItem({ capsule, index }: TimelineItemProps) {
  const countdown = useCountdown(capsule.unlockDate);

  const getStatusIcon = () => {
    if (capsule.isUnlocked) {
      return '✅';
    }
    const daysLeft = Math.ceil((capsule.unlockDate - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) {
      return '⏰';
    }
    return '🔒';
  };

  const getStatusBadgeColor = () => {
    if (capsule.isUnlocked) {
      return 'success';
    }
    const daysLeft = Math.ceil((capsule.unlockDate - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) {
      return 'warning';
    }
    return 'default';
  };

  return (
    <motion.div
      custom={index}
      variants={timelineItemEntry}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="relative"
    >
      {/* Timeline marker and line */}
      <div className="flex gap-6">
        {/* Left marker */}
        <div className="relative flex flex-col items-center">
          <motion.div
            variants={emojiPulse}
            initial="initial"
            whileHover="hover"
            className="text-2xl cursor-pointer"
          >
            {getStatusIcon()}
          </motion.div>
          {/* Connector line */}
          <div className="hidden sm:block absolute top-12 left-1/2 -translate-x-1/2 w-1 h-12 bg-gradient-to-b from-purple-400 to-transparent dark:from-purple-600" />
        </div>

        {/* Content */}
        <Link href={`/capsule/${capsule.id}`} className="flex-1 pb-12">
          <motion.div
            variants={cardHover}
            initial="initial"
            whileHover="hover"
          >
            <Card
              hoverable
              className="p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <motion.div
                    variants={emojiPulse}
                    initial="initial"
                    whileHover="hover"
                    className="text-4xl flex-shrink-0"
                  >
                    {MOOD_EMOJIS[capsule.mood]}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                      {capsule.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Unlocks: <span className="font-semibold">{formatDate(capsule.unlockDate)}</span>
                    </p>
                  </div>
                </div>
                <Badge variant={getStatusBadgeColor()} size="sm">
                  {capsule.isUnlocked ? 'Unlocked' : capsule.unlockDate - Date.now() <= 7 * 24 * 60 * 60 * 1000 ? 'Soon' : 'Locked'}
                </Badge>
              </div>

              {/* Mood label */}
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
                Mood: {capsule.mood}
              </p>

              {/* Countdown if not unlocked */}
              {!capsule.isUnlocked && countdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                >
                  <CountdownTimer countdown={countdown} compact />
                </motion.div>
              )}

              {/* Metadata */}
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Created {formatDate(capsule.createdAt)}</span>
                <motion.svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </motion.svg>
              </div>
            </Card>
          </motion.div>
        </Link>
      </div>
    </motion.div>
  );
}
