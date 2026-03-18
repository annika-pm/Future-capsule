'use client';

import { motion } from 'framer-motion';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onDismiss?: () => void;
  retryAction?: () => void;
  variant?: 'error' | 'warning' | 'info';
}

export function ErrorAlert({
  title = 'Error',
  message,
  onDismiss,
  retryAction,
  variant = 'error',
}: ErrorAlertProps) {
  const colors = {
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: '❌',
      textTitle: 'text-red-900 dark:text-red-300',
      textBody: 'text-red-800 dark:text-red-200',
      button: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: '⚠️',
      textTitle: 'text-yellow-900 dark:text-yellow-300',
      textBody: 'text-yellow-800 dark:text-yellow-200',
      button: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'ℹ️',
      textTitle: 'text-blue-900 dark:text-blue-300',
      textBody: 'text-blue-800 dark:text-blue-200',
      button: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600',
    },
  };

  const color = colors[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-lg border p-4 ${color.bg} ${color.border}`}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0 text-xl">{color.icon}</div>
        <div className="flex-1">
          <h3 className={`font-semibold ${color.textTitle}`}>{title}</h3>
          <p className={`text-sm mt-1 ${color.textBody}`}>{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 ${color.textTitle} hover:opacity-70`}
            aria-label="Dismiss"
          >
            ✕
          </button>
        )}
      </div>

      {/* Action buttons */}
      {(retryAction || onDismiss) && (
        <div className="mt-3 flex gap-2">
          {retryAction && (
            <button
              onClick={retryAction}
              className={`px-3 py-1 text-sm font-medium text-white rounded transition-colors ${color.button}`}
            >
              Retry
            </button>
          )}
          {onDismiss && !retryAction && (
            <button
              onClick={onDismiss}
              className={`px-3 py-1 text-sm font-medium text-white rounded transition-colors ${color.button}`}
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
