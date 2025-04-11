"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface MaskRevealProps {
  children: ReactNode
  direction?: "left" | "right" | "up" | "down"
  delay?: number
  duration?: number
  className?: string
}

const MaskReveal = ({ children, direction = "left", delay = 0, duration = 0.8, className = "" }: MaskRevealProps) => {
  // Define animation variants based on direction
  const variants = {
    hidden: {
      opacity: 0,
      x: direction === "left" ? -100 : direction === "right" ? 100 : 0,
      y: direction === "up" ? 100 : direction === "down" ? -100 : 0,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
      },
    },
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div initial="hidden" animate="visible" variants={variants} style={{ willChange: "transform, opacity" }}>
        {children}
      </motion.div>
    </div>
  )
}

export default MaskReveal
