/**
 * Animation Utilities - Reusable animation configurations
 * Premium micro-interactions and transitions for CourseAI
 */

import { Variants, Transition } from 'framer-motion'

// ========== TIMING FUNCTIONS ==========
const easings = {
  smooth: [0.4, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  sharp: [0.4, 0, 0.6, 1],
  standard: [0.4, 0, 0.2, 1],
} as const

// ========== CARD ANIMATIONS ==========
export const cardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: easings.smooth
    }
  },
  hover: {
    y: -4,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: easings.smooth
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  }
}

// ========== BUTTON ANIMATIONS ==========
const buttonVariants: Variants = {
  rest: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: easings.smooth
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  }
}

// ========== BADGE/PILL ANIMATIONS ==========
export const badgeVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.2,
      ease: easings.smooth
    }
  },
  hover: {
    scale: 1.1,
    transition: {
      duration: 0.15
    }
  }
}

// ========== STAGGER ANIMATIONS ==========
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

export const staggerItemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: easings.smooth
    }
  },
}

// ========== PAGE TRANSITION ==========
const pageTransitionVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: easings.smooth
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.3
    }
  }
}

// ========== MODAL/OVERLAY ANIMATIONS ==========
const modalVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: 20
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: easings.smooth
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2
    }
  }
}

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      duration: 0.2
    }
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.2
    }
  }
}

// ========== SLIDE ANIMATIONS ==========
const slideInVariants = {
  fromRight: {
    hidden: { x: 100, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: easings.smooth
      }
    },
  },
  fromLeft: {
    hidden: { x: -100, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: easings.smooth
      }
    },
  },
  fromTop: {
    hidden: { y: -100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: easings.smooth
      }
    },
  },
  fromBottom: {
    hidden: { y: 100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: easings.smooth
      }
    },
  },
}

// ========== PROGRESS BAR ANIMATION ==========
const progressBarVariants: Variants = {
  initial: { width: 0, opacity: 0 },
  animate: (progress: number) => ({
    width: `${progress}%`,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: easings.smooth
    }
  })
}

// ========== ICON ANIMATIONS ==========
const iconVariants: Variants = {
  rest: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.2,
    rotate: 5,
    transition: {
      duration: 0.2,
      ease: easings.bounce
    }
  },
  tap: {
    scale: 0.9,
    transition: {
      duration: 0.1
    }
  }
}

// ========== NOTIFICATION ANIMATIONS ==========
const notificationVariants: Variants = {
  hidden: { 
    x: 400, 
    opacity: 0,
    scale: 0.9
  },
  visible: { 
    x: 0, 
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  },
  exit: { 
    x: 400, 
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.2,
      ease: easings.sharp
    }
  }
}

// ========== LOADING ANIMATIONS ==========
const loadingSpinVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  }
}

const loadingPulseVariants: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: easings.smooth
    }
  }
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Create a custom spring transition
 */
const createSpring = (
  stiffness: number = 100,
  damping: number = 15,
  mass: number = 1
): Transition => ({
  type: 'spring',
  stiffness,
  damping,
  mass
})

/**
 * Create a custom tween transition
 */
const createTween = (
  duration: number = 0.3,
  ease: readonly number[] | string = easings.smooth
): Transition => ({
  type: 'tween',
  duration,
  ease
})

/**
 * Create a stagger transition config
 */
const createStagger = (
  staggerChildren: number = 0.1,
  delayChildren: number = 0
): Transition => ({
  staggerChildren,
  delayChildren
})

/**
 * Hover scale effect for interactive elements
 */
const hoverScale = (scale: number = 1.05) => ({
  whileHover: { scale },
  whileTap: { scale: 0.95 },
  transition: { duration: 0.2 }
})

/**
 * Fade in and slide up animation
 */
export const fadeInUp = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      delay,
      ease: easings.smooth
    }
  }
})

/**
 * Scale in animation
 */
const scaleIn = (delay: number = 0) => ({
  initial: { opacity: 0, scale: 0.9 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.2,
      delay,
      ease: easings.smooth
    }
  }
})
