/**
 * Reusable Framer Motion Animation Variants
 * 
 * Centralized animation definitions for consistent, performant animations
 * throughout the app. These variants respect prefers-reduced-motion.
 */

import { Variants } from 'framer-motion';

// Helper to check if user prefers reduced motion
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Page Transitions
 */
export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

/**
 * Fade In/Out
 */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

/**
 * Slide Animations
 */
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

export const slideInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

/**
 * Scale Animations
 */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

export const scaleInSmall: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

/**
 * Card Animations
 */
export const cardHover: Variants = {
  initial: { y: 0 },
  hover: {
    y: -8,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

export const cardTap: Variants = {
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

/**
 * Stagger Container (for animating multiple children)
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
};

/**
 * Button Interactions
 */
export const buttonHover: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};

export const buttonPress: Variants = {
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

/**
 * Modal/Dialog Animations
 */
export const modalSlideUp: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: 50,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

export const backdropFade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/**
 * Loading Spinner
 */
export const spinnerRotate = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * Bounce/Wiggle Animations
 */
export const wiggle: Variants = {
  hidden: { rotate: 0 },
  animate: {
    rotate: [0, -5, 5, -5, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
};

export const bounce: Variants = {
  hidden: { y: 0 },
  animate: {
    y: [-4, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Number Counter Animation (for countdown, stats)
 */
export const numberCounter = (value: number) => ({
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
});

/**
 * Pulse Animation (for loading/attention)
 */
export const pulse: Variants = {
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Timeline Item Animation
 */
export const timelineItemEntry: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (custom: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      delay: custom * 0.05,
      ease: 'easeOut',
    },
  }),
};

/**
 * Badge/Emoji Animation
 */
export const emojiPulse: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: [1, 1.2, 1],
    rotate: [0, 10, -10, 0],
    transition: {
      duration: 0.4,
      ease: 'easeInOut',
    },
  },
};

/**
 * Progress Bar Animation
 */
export const progressBar: Variants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

/**
 * Tooltip/Popover Animations
 */
export const tooltipFade: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.15 },
  },
};

/**
 * Chart Animation
 */
export const chartFadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      delayChildren: 0.1,
      staggerChildren: 0.1,
    },
  },
};

/**
 * Get animation variant with reduced motion support
 */
export const getAnimationVariant = (variant: Variants): Variants => {
  if (prefersReducedMotion()) {
    // Return instant variants without animation
    return {
      hidden: variant.hidden,
      visible: { ...variant.visible, transition: { duration: 0 } },
    };
  }
  return variant;
};
