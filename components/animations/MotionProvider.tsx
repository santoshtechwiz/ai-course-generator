"use client"

import { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface MotionProviderProps {
  children: ReactNode
  mode?: 'wait' | 'sync' | 'popLayout'
}

/**
 * Global motion configuration and AnimatePresence wrapper
 */
export function MotionProvider({ children, mode = 'wait' }: MotionProviderProps) {
  return (
    <AnimatePresence mode={mode}>
      {children}
    </AnimatePresence>
  )
}

/**
 * Higher-order component to wrap components with motion
 */
export function withMotion<P extends object>(
  Component: React.ComponentType<P>,
  motionProps?: any
) {
  const MotionComponent = (props: P) => (
    <motion.div {...motionProps}>
      <Component {...props} />
    </motion.div>
  )

  MotionComponent.displayName = `withMotion(${Component.displayName || Component.name})`
  return MotionComponent
}