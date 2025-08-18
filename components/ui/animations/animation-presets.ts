"use client"

// Types are relaxed to accommodate Framer Motion variants across versions

/**
 * Animation Presets
 *
 * A collection of reusable animation presets for common UI patterns.
 * These can be used with any Framer Motion component.
 */

// Basic fade animations
export const FADE = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
}

// Directional slide animations
export const SLIDE_UP = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
}

export const SLIDE_DOWN = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
}

export const SLIDE_LEFT = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
}

export const SLIDE_RIGHT = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
}

// Scale animations
export const SCALE = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
}

export const SCALE_UP = {
  initial: { opacity: 0, scale: 0.8, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.8, y: 20 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
}

// Modal/dialog animations
export const MODAL = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
}

// Attention-grabbing animations
export const PULSE = {
  initial: { opacity: 1, scale: 1 },
  animate: { opacity: 1, scale: [1, 1.05, 1] },
  transition: { duration: 0.5, ease: "easeInOut" },
}

export const BOUNCE = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: [20, -15, 10, -5, 0] },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.6 },
}

// Page transitions
export const PAGE_TRANSITION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
}

export const PAGE_SLIDE = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
}

// Staggered animations for lists
export const getStaggeredAnimation = (staggerDuration = 0.05) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
})

export const getStaggeredContainerAnimation = (staggerDuration = 0.05) => ({
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDuration,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: staggerDuration,
      staggerDirection: -1,
    },
  },
})

// Hover animations
export const HOVER_SCALE = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.98 },
}

export const HOVER_LIFT = {
  whileHover: { y: -5 },
  whileTap: { y: 0 },
}

export const HOVER_GLOW = {
  whileHover: {
    boxShadow: "0 0 8px rgba(var(--primary), 0.6)",
  },
}

// Toast/notification animations
export const TOAST_SLIDE_RIGHT = {
  initial: { opacity: 0, x: -100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
  transition: { duration: 0.2, ease: "easeOut" },
}

export const TOAST_SLIDE_UP = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 50 },
  transition: { duration: 0.2, ease: "easeOut" },
}

// Accordion/collapse animations
export const ACCORDION = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
}

// Utility function to create custom duration variants
export const withDuration = (preset: any, duration: number) => ({
  ...preset,
  transition: { ...preset.transition, duration },
})

// Utility function to create custom ease variants
export const withEase = (preset: any, ease: string | number[]) => ({
  ...preset,
  transition: { ...preset.transition, ease },
})

// Utility function to create custom delay variants
export const withDelay = (preset: any, delay: number) => ({
  ...preset,
  transition: { ...preset.transition, delay },
})

// Spring animations
export const SPRING_BOUNCE = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 50 },
  transition: {
    type: "spring",
    stiffness: 400,
    damping: 15,
  },
}

export const SPRING_GENTLE = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: {
    type: "spring",
    stiffness: 100,
    damping: 20,
  },
}
