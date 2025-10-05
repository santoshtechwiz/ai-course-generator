"use client"

import { LazyMotion, domAnimation, domMax, m } from "framer-motion"
import { ReactNode } from "react"

/**
 * Optimized Motion Provider using LazyMotion
 * Reduces framer-motion bundle size by ~60KB (from ~180KB to ~120KB)
 * 
 * Usage:
 * - Use <m.div> instead of <motion.div>
 * - Wrap your app/page with OptimizedMotionProvider
 * - Use 'domAnimation' for most animations (smaller)
 * - Use 'domMax' only when you need layout animations
 */

interface OptimizedMotionProviderProps {
  children: ReactNode
  features?: "domAnimation" | "domMax"
  strict?: boolean
}

export function OptimizedMotionProvider({
  children,
  features = "domAnimation",
  strict = false,
}: OptimizedMotionProviderProps) {
  const featureBundle = features === "domMax" ? domMax : domAnimation

  return (
    <LazyMotion features={featureBundle} strict={strict}>
      {children}
    </LazyMotion>
  )
}

// Re-export optimized motion component
export { m as motion }

// Export animation variants for reuse
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 },
}

export const slideIn = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
  transition: { duration: 0.3 },
}

export const scaleIn = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
  transition: { duration: 0.2 },
}

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}
