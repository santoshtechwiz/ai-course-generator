"use client"

import { ReactNode } from 'react'
import { AnimatePresence } from 'framer-motion'

interface MotionProviderProps {
  children: ReactNode
}

export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {children}
    </AnimatePresence>
  )
}

// Higher-order component for wrapping components with motion
function withMotion<T extends object>(
  Component: React.ComponentType<T>,
  motionProps?: any
) {
  const WrappedComponent = (props: T) => (
    <MotionProvider>
      <Component {...props} />
    </MotionProvider>
  )

  WrappedComponent.displayName = `withMotion(${Component.displayName || Component.name})`
  return WrappedComponent
}
