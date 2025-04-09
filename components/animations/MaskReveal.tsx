"use client"

import type React from "react"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"

interface MaskRevealProps {
  children: React.ReactNode
  direction?: "left" | "right" | "top" | "bottom" | "center"
  delay?: number
  duration?: number
  className?: string
  once?: boolean
}

const MaskReveal = ({
  children,
  direction = "left",
  delay = 0,
  duration = 0.8,
  className = "",
  once = true,
}: MaskRevealProps) => {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, amount: 0.3 })

  // Define clip path based on direction
  const getInitialClipPath = () => {
    switch (direction) {
      case "left":
        return "inset(0 100% 0 0)"
      case "right":
        return "inset(0 0 0 100%)"
      case "top":
        return "inset(100% 0 0 0)"
      case "bottom":
        return "inset(0 0 100% 0)"
      case "center":
        return "inset(50% 50% 50% 50%)"
      default:
        return "inset(0 100% 0 0)"
    }
  }

  return (
    <motion.div
      ref={ref}
      initial={{ clipPath: getInitialClipPath() }}
      animate={isInView ? { clipPath: "inset(0 0 0 0)" } : { clipPath: getInitialClipPath() }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export default MaskReveal
