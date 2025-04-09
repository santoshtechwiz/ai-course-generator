"use client"

import type React from "react"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

interface ParallaxSectionProps {
  children: React.ReactNode
  className?: string
  speed?: number
  direction?: "up" | "down" | "left" | "right"
  offset?: number[]
  outputRange?: number[]
}

const ParallaxSection = ({
  children,
  className = "",
  speed = 0.5,
  direction = "up",
  offset = [0, 1],
  outputRange,
}: ParallaxSectionProps) => {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })

  // Calculate output range based on direction and speed if not provided
  const getOutputRange = () => {
    if (outputRange) return outputRange

    switch (direction) {
      case "up":
        return [0, -100 * speed]
      case "down":
        return [0, 100 * speed]
      case "left":
        return [0, -100 * speed]
      case "right":
        return [0, 100 * speed]
      default:
        return [0, -100 * speed]
    }
  }

  const calculatedOutputRange = getOutputRange()

  const transform = useTransform(scrollYProgress, offset, calculatedOutputRange)

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        style={{
          y: direction === "up" || direction === "down" ? transform : 0,
          x: direction === "left" || direction === "right" ? transform : 0,
          willChange: "transform",
        }}
      >
        {children}
      </motion.div>
    </div>
  )
}

export default ParallaxSection
