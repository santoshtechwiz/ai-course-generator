"use client"

import type React from "react"

import { MotionConfig, AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { usePathname } from "next/navigation"

const APPLE_EASING: [number, number, number, number] = [0.22, 0.61, 0.36, 1]

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()

  return (
    <MotionConfig reducedMotion={prefersReducedMotion ? "always" : "never"}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.45, ease: APPLE_EASING }}
          className="will-change-[opacity,transform]"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  )
}