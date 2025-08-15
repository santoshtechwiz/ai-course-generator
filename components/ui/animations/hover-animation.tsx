"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"
import * as PRESETS from "./animation-presets"
type PresetMap = typeof PRESETS
function getPreset<K extends keyof PresetMap>(key: K): PresetMap[K] {
  return PRESETS[key]
}

type HoverPresetType = "HOVER_SCALE" | "HOVER_LIFT" | "HOVER_GLOW" | string
type HoverAnimationProps = {
  children: ReactNode
  preset: HoverPresetType | any
  className?: string
}

export function HoverAnimation({ children, preset, className }: HoverAnimationProps) {
  // Get the preset animation
  const animation: any = typeof preset === "string" ? (getPreset(preset as keyof PresetMap) as any) : preset

  return (
    <motion.div
      className={className}
      whileHover={animation.whileHover}
      whileTap={animation.whileTap}
      transition={animation.transition}
    >
      {children}
    </motion.div>
  )
}
