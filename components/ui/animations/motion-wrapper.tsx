"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"

type Direction = "up" | "down" | "left" | "right"
type Variant = "fade" | "slide" | "scale" | "none"

interface MotionWrapperProps {
  children: ReactNode
  animate?: boolean
  variant?: Variant
  direction?: Direction
  duration?: number
  delay?: number
  className?: string
}

export function MotionWrapper({
  children,
  animate = true,
  variant = "fade",
  direction = "up",
  duration = 0.5,
  delay = 0,
  className,
}: MotionWrapperProps) {
  if (!animate) {
    return <div className={className}>{children}</div>
  }

  // Define animation variants
  const getVariants = () => {
    const distance = 20

    const directionMap = {
      up: { y: distance },
      down: { y: -distance },
      left: { x: distance },
      right: { x: -distance },
    }

    const initial = {
      fade: { opacity: 0 },
      slide: { opacity: 0, ...directionMap[direction] },
      scale: { opacity: 0, scale: 0.95 },
      none: {},
    }

    const animate = {
      fade: { opacity: 1 },
      slide: { opacity: 1, x: 0, y: 0 },
      scale: { opacity: 1, scale: 1 },
      none: {},
    }

    return { initial, animate }
  }

  const { initial, animate: animateVariant } = getVariants()

  return (
    <motion.div
      initial={variant !== "none" ? initial[variant] : undefined}
      animate={variant !== "none" ? animateVariant[variant] : undefined}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
