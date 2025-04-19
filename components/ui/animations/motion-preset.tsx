"use client"

import { AnimatePresence, motion } from "framer-motion"
import type { ReactNode } from "react"
import * as PRESETS from "./animation-presets"

type PresetType = keyof typeof PRESETS
type MotionPresetProps = {
  children: ReactNode
  preset: PresetType | any
  className?: string
  duration?: number
  delay?: number
  ease?: string | number[]
  itemKey?: string | number
}

export function MotionPreset({ children, preset, className, duration, delay, ease, itemKey }: MotionPresetProps) {
  // Get the preset animation
  let animation = typeof preset === "string" ? PRESETS[preset] : preset

  // Apply custom duration, delay, or ease if provided
  if (duration !== undefined) {
    animation = PRESETS.withDuration(animation, duration)
  }

  if (delay !== undefined) {
    animation = PRESETS.withDelay(animation, delay)
  }

  if (ease !== undefined) {
    animation = PRESETS.withEase(animation, ease)
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={itemKey}
        className={className}
        initial={animation.initial}
        animate={animation.animate}
        exit={animation.exit}
        transition={animation.transition}
        whileHover={animation.whileHover}
        whileTap={animation.whileTap}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
