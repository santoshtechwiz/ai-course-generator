/**
 * Shared Animation Variants for Quiz Components
 * 
 * Centralized animation definitions to prevent duplication across
 * blanks, openended, mcq, and other quiz types.
 * 
 * Use these variants for consistent animations throughout the quiz system.
 */

/**
 * Standard container animation with stagger effect
 * Used for wrapping quiz content and creating smooth page transitions
 */
export const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
      duration: 0.6,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      when: "afterChildren",
      staggerChildren: 0.05,
      staggerDirection: -1,
      duration: 0.4,
      ease: "easeIn",
    },
  },
}

/**
 * Item animation with spring physics
 * Used for individual quiz elements (questions, answers, hints, etc.)
 */
export const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: { duration: 0.3 },
  },
}

/**
 * Fade-in animation for subtle elements
 * Used for hints, feedback, and secondary UI elements
 */
const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3, ease: "easeIn" },
  },
}

/**
 * Slide-up animation for modals and alerts
 * Used for confirmation dialogs, success messages, etc.
 */
const slideUpVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 30 },
  },
  exit: {
    opacity: 0,
    y: 50,
    transition: { duration: 0.2 },
  },
}

/**
 * Scale animation for buttons and interactive elements
 * Used for hover states and click feedback
 */
const scaleVariants = {
  initial: { scale: 1 },
  hover: { 
    scale: 1.05, 
    transition: { type: "spring", stiffness: 400, damping: 10 } 
  },
  tap: { 
    scale: 0.95, 
    transition: { duration: 0.1 } 
  },
}

/**
 * Stagger children animation
 * Used for lists and groups of elements
 */
const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

/**
 * Quiz progress bar animation
 * Used for smooth progress updates
 */
const progressVariants = {
  initial: { scaleX: 0 },
  animate: (progress: number) => ({
    scaleX: progress / 100,
    transition: { 
      duration: 0.5, 
      ease: "easeOut" 
    },
  }),
}

/**
 * Success celebration animation
 * Used when user completes a quiz or gets correct answer
 */
const celebrationVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
}

/**
 * Error shake animation
 * Used for incorrect answers or validation errors
 */
const shakeVariants = {
  shake: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.4 },
  },
}
