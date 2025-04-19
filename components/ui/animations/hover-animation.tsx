"use client"

import type React from "react"

import { motion } from "framer-motion"
import type { ReactNode } from "react"
import * as PRESETS from "./animation-presets"

type HoverPresetType = "HOVER_SCALE" | "HOVER_LIFT" | "HOVER_GLOW" | string
type HoverAnimationProps = {
  children: ReactNode
  preset: HoverPresetType | any
  className?: string
  as?: React.ElementType
}

export function HoverAnimation({ children, preset, className, as = "div" }: HoverAnimationProps) {
  const Component = motion[as as keyof typeof motion] || motion.div

  // Get the preset animation
  const animation = typeof preset === "string" ? PRESETS[preset] : preset

  return (
    <Component
      className={className}
      whileHover={animation.whileHover}
      whileTap={animation.whileTap}
      transition={animation.transition}
    >
      {children}
    </Component>
  )
}
