"use client"
import React, { useId } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { QUIZ_TYPE_CONFIG } from "./quiz-type-config"

type QuizType = "mcq" | "code" | "flashcard" | "openended" | "blanks" | "ordering"

export function QuizTypeIllustration({ type }: { type: QuizType }) {
  const src = `/quiz-illustrations/${type}.svg`
  const alt = `${type} illustration`
  const id = useId()

  const config = (QUIZ_TYPE_CONFIG as any)[type] || QUIZ_TYPE_CONFIG.mcq

  return (
  <motion.div
      key={id}
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ scale: 1.06, y: -2 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className={cn(
        "w-20 h-20 mx-auto p-2 rounded-lg flex items-center justify-center",
        // neobrutal framing
        "border-4 shadow-[4px_4px_0_#000]",
        // per-type theme classes (bg, border)
        config.bg,
        config.border,
      )}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback to mcq if a specific illustration is missing and log for debugging
          const target = e.currentTarget as HTMLImageElement
          if (target.src && !target.dataset.fallback) {
            console.warn(`[QuizTypeIllustration] failed to load ${target.src}, falling back to mcq.svg`)
            target.dataset.fallback = "1"
            target.src = `/quiz-illustrations/mcq.svg`
          }
        }}
      />
    </motion.div>
  )
}

export default QuizTypeIllustration
