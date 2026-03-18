'use client';

import { motion } from 'framer-motion';
import { MoodCardProps } from '../../types/mood-stats';
import { scaleIn } from '../../lib/animations';

interface MoodCardComponentProps extends MoodCardProps {
  delay?: number;
}

export function MoodCard({ mood, count, percentage, emoji, delay = 0 }: MoodCardComponentProps) {
  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-6 border border-purple-200 dark:border-purple-700 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: delay + 0.1, type: 'spring', stiffness: 200 }}
        className="text-5xl mb-3"
      >
        {emoji}
      </motion.div>
      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">{mood}</h3>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay + 0.2 }}
        className="space-y-2"
      >
        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{count}</p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ delay: delay + 0.3, duration: 0.5 }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
          />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{percentage.toFixed(0)}% of capsules</p>
      </motion.div>
    </motion.div>
  );
}
