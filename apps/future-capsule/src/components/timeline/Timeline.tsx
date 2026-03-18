'use client';

import { motion } from 'framer-motion';
import { Capsule } from '../../types/capsule';

interface TimelineProps {
  capsules: Capsule[];
}

export function Timeline({ capsules }: TimelineProps) {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-3 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 to-blue-500 md:-translate-x-1/2" />

      <div className="space-y-8 md:space-y-12">
        {capsules.map((capsule, index) => (
          <motion.div
            key={capsule.id}
            initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className={`flex ${index % 2 === 0 ? 'md:justify-start' : 'md:justify-end'}`}
          >
            {/* Timeline dot */}
            <div className="absolute left-0 w-7 h-7 bg-white dark:bg-gray-800 border-4 border-purple-500 rounded-full md:left-1/2 md:-translate-x-1/2" />

            {/* Content */}
            <div className={`ml-12 md:ml-0 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'} w-full md:w-1/2`}>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{capsule.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {capsule.isUnlocked ? 'Opened' : 'Locked'} • {new Date(capsule.createdAt).toLocaleDateString()}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
