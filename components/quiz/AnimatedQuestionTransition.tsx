"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ReactNode } from "react"

interface AnimatedQuestionTransitionProps {
  children: ReactNode
  isActive: boolean
  direction?: 1 | -1
  animationKey: string | number
}

export function AnimatedQuestionTransition({
  children,
  isActive,
  direction = 1,
  animationKey,
}: AnimatedQuestionTransitionProps) {
  const xOffset = 20 * direction
  
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={animationKey}
          initial={{ opacity: 0, x: xOffset }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -xOffset }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
