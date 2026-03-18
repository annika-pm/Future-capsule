'use client';

import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '../../lib/animations';

interface StatsGridProps {
  children: React.ReactNode;
}

export function StatsGrid({ children }: StatsGridProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {children}
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  color?: 'purple' | 'blue' | 'green' | 'yellow';
  delay?: number;
}

export function StatCard({ label, value, icon, color = 'purple', delay = 0 }: StatCardProps) {
  const colorClasses = {
    purple: 'from-purple-500 to-pink-500',
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    yellow: 'from-yellow-500 to-orange-500',
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
      className={`bg-gradient-to-br ${colorClasses[color]} dark:${colorClasses[color]} rounded-lg p-6 text-white`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">{label}</p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + 0.2 }}
            className="text-4xl font-bold mt-2"
          >
            {value}
          </motion.p>
        </div>
        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: delay + 0.1, type: 'spring' }}
          className="text-5xl opacity-20"
        >
          {icon}
        </motion.div>
      </div>
    </motion.div>
  );
}
