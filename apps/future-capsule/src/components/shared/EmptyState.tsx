'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function EmptyState({
  icon = '📭',
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring' }}
        className="text-6xl mb-4"
      >
        {icon}
      </motion.div>

      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
        {description}
      </p>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        {action && (
          <Button asChild size="lg">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        )}

        {secondaryAction && (
          <Button
            variant="outline"
            size="lg"
            onClick={secondaryAction.onClick}
            {...(secondaryAction.href && { asChild: true })}
          >
            {secondaryAction.href ? (
              <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
            ) : (
              secondaryAction.label
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
