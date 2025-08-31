"use client"

import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface QuizContainerProps {
  children: React.ReactNode
  animationKey?: string
  className?: string
  variant?: "default" | "compact" | "expanded"
  fullWidth?: boolean
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.3, ease: "easeIn" },
  },
}

/**
 * Unified Quiz Container Component
 *
 * Provides consistent UX patterns across all quiz types:
 * - Clean, professional layout
 * - Consistent spacing and responsive design
 * - Minimal nesting for better performance
 * - Focus mode friendly
 */
export function QuizContainer({
  children,
  animationKey,
  className,
  variant = "default",
  fullWidth = true,
}: QuizContainerProps) {
  const containerClasses = cn(
    "w-full flex flex-col",
    variant === "compact" && "max-w-3xl mx-auto",
    variant === "expanded" && "min-h-[calc(100vh-2rem)]",
    variant === "default" && "max-w-5xl mx-auto",
    className
  )

  return (
    <div className={containerClasses}>
      <AnimatePresence mode="wait">
        <motion.div
          key={animationKey}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full flex-1 flex flex-col"
        >
          {/* Enhanced content container with better spacing */}
          <div className="w-full space-y-8">{children}</div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
