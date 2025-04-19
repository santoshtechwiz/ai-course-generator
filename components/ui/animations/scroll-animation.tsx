"use client"

import { motion, useInView } from "framer-motion"
import { useRef, type ReactNode } from "react"
import * as PRESETS from "./animation-presets"

type ScrollAnimationProps = {
  children: ReactNode
  preset: string | any
  className?: string
  threshold?: number
  once?: boolean
  delay?: number
}

export function ScrollAnimation({
  children,
  preset,
  className,
  threshold = 0.1,
  once = true,
  delay = 0,
}: ScrollAnimationProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    threshold,
    once,
  })

  // Get the preset animation
  let animation = typeof preset === "string" ? PRESETS[preset] : preset

  // Add delay if provided
  if (delay) {
    animation = PRESETS.withDelay(animation, delay)
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={animation.initial}
      animate={isInView ? animation.animate : animation.initial}
      transition={animation.transition}
    >
      {children}
    </motion.div>
  )
}
