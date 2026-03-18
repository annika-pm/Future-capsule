'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Card } from '../shared/Card';
import { Badge } from '../shared/Badge';
import { Button } from '../shared/Button';
import { useCountdown } from '../../hooks/useCountdown';
import { MOOD_EMOJIS, Capsule, CapsuleListItem } from '../../types/capsule';
import { formatDate, formatCountdown } from '../../lib/utils';
import { CountdownTimer } from './CountdownTimer';
import { cardHover, emojiPulse, buttonPress, fadeInUp } from '../../lib/animations';

interface CapsuleCardProps {
  capsule: Capsule | CapsuleListItem;
  onDelete?: () => void;
}

export function CapsuleCard({ capsule, onDelete }: CapsuleCardProps) {
  const countdown = useCountdown(capsule.unlockDate);
  const [isHovered, setIsHovered] = useState(false);

  // Determine status color
  const getStatusColor = () => {
    if (capsule.isUnlocked) {
      return {
        badge: 'success',
        border: 'border-green-300 dark:border-green-700',
        bg: 'bg-green-50 dark:bg-green-900/20',
        shadow: 'shadow-green-500/20',
      };
    }
    const daysLeft = Math.ceil((capsule.unlockDate - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 7) {
      return {
        badge: 'warning',
        border: 'border-yellow-300 dark:border-yellow-700',
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        shadow: 'shadow-yellow-500/20',
      };
    }
    return {
      badge: 'default',
      border: 'border-purple-300 dark:border-purple-700',
      bg: 'bg-purple-50 dark:bg-purple-900/10',
      shadow: 'shadow-purple-500/20',
    };
  };

  const status = getStatusColor();

  return (
    <motion.div
      variants={cardHover}
      initial="initial"
      whileHover="hover"
      animate={{ y: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        hoverable
        className={`overflow-hidden h-full flex flex-col border-0 bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur transition-all duration-300 hover:from-slate-800 hover:to-slate-800/80 hover:shadow-xl hover:shadow-blue-500/10`}
      >
        {/* Photo Header with gradient overlay */}
        {capsule.photoURL && (
          <div className="relative w-full h-48 bg-gradient-to-b from-slate-700 to-slate-800 overflow-hidden">
            <motion.img
              src={capsule.photoURL}
              alt={capsule.title}
              animate={isHovered && !capsule.isUnlocked ? { scale: 1.05 } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full object-cover"
            />
            {!capsule.isUnlocked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 0.85 : 0.5 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex items-center justify-center"
              >
                <motion.span
                  animate={isHovered ? { scale: 1.2, y: -5 } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-5xl drop-shadow-lg"
                >
                  🔒
                </motion.span>
              </motion.div>
            )}
          </div>
        )}

        {/* Card Content with premium spacing */}
        <div className="flex-1 p-6 flex flex-col">
          {/* Mood Emoji - Top Right */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-white line-clamp-2 break-words mb-1">
                {capsule.title}
              </h3>
              <p className="text-xs text-slate-400">
                Created {formatDate(capsule.createdAt)}
              </p>
            </div>
            <motion.div
              variants={emojiPulse}
              initial="initial"
              whileHover="hover"
              className="text-4xl flex-shrink-0"
            >
              {MOOD_EMOJIS[capsule.mood]}
            </motion.div>
          </div>

          {/* Mood Label & Status Badge */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs px-3 py-1 rounded-full bg-slate-700/50 text-slate-300">
              {capsule.mood}
            </span>
            {capsule.isUnlocked ? (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-300 font-medium"
              >
                ✅ Unlocked
              </motion.span>
            ) : (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="text-xs px-3 py-1 rounded-full bg-blue-500/20 text-blue-300"
              >
                🔒 Locked
              </motion.span>
            )}
          </div>

          {/* Countdown Display */}
          {countdown && !capsule.isUnlocked && (
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
              className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30"
            >
              <p className="text-xs text-blue-300 font-medium mb-2">Opens in</p>
              <p className="text-sm font-bold text-blue-200">
                {formatCountdown(countdown)}
              </p>
            </motion.div>
          )}

          {/* Message Preview (if unlocked) */}
          {capsule.isUnlocked && 'message' in capsule && capsule.message && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-4 p-3 rounded-lg bg-slate-700/50 text-slate-300 text-xs leading-relaxed line-clamp-2"
            >
              {capsule.message}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="mt-auto flex gap-2 pt-4 border-t border-slate-700/50">
            <motion.div
              className="flex-1"
              variants={buttonPress}
              whileHover={{ scale: 1.02 }}
            >
              <Button
                variant="primary"
                size="sm"
                asChild
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:shadow-lg hover:shadow-blue-500/50 border-0"
              >
                <Link href={`/capsule/${capsule.id}`}>
                  {capsule.isUnlocked ? '👁️ Open' : '🔒 View'}
                </Link>
              </Button>
            </motion.div>

            {onDelete && (
              <motion.div
                variants={buttonPress}
                whileHover={{ scale: 1.02 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDelete}
                  className="flex-shrink-0 px-3 border-slate-600 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-300"
                  title="Delete this capsule"
                >
                  🗑️
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
