"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface RevealAnimationProps {
  children: ReactNode
  delay?: number
  direction?: "up" | "down" | "left" | "right"
  className?: string
}

export default function RevealAnimation({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: RevealAnimationProps) {
  // Define animation variants based on direction
  const getVariants = () => {
    const distance = 50

    const variants = {
      hidden: {
        opacity: 0,
        y: direction === "up" ? distance : direction === "down" ? -distance : 0,
        x: direction === "left" ? distance : direction === "right" ? -distance : 0,
      },
      visible: {
        opacity: 1,
        y: 0,
        x: 0,
        transition: {
          duration: 0.8,
          delay,
          ease: [0.25, 0.1, 0.25, 1], // Apple-style easing
        },
      },
    }

    return variants
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={getVariants()}
      className={className}
    >
      {children}
    </motion.div>
  )
}
