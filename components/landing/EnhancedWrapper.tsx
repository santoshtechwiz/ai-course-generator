"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"

interface EnhancedWrapperProps {
  children: ReactNode
  delay?: number
  className?: string
}

/**
 * A wrapper component that adds Apple-style animations to any component
 * This can be used to enhance existing components without modifying them
 */
export default function EnhancedWrapper({ children, delay = 0, className = "" }: EnhancedWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
      }}
      viewport={{ once: true, amount: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
