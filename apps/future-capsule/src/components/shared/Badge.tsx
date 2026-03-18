'use client';

import React from 'react';
import clsx from 'clsx';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export function Badge({ variant = 'default', size = 'sm', className, children, ...props }: BadgeProps) {
  const variantStyles = {
    default: 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100',
    success: 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100',
    warning: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100',
    danger: 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-100',
  };

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span className={clsx('font-medium rounded-full', variantStyles[variant], sizeStyles[size], className)} {...props}>
      {children}
    </span>
  );
}
