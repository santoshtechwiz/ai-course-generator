"use client"

import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface QuizContainerProps {
  children: React.ReactNode
  animationKey?: string
  className?: string
  variant?: "default" | "compact" | "expanded" | "minimal"
  fullWidth?: boolean
  showProgress?: boolean
  progressValue?: number
  questionNumber?: number
  totalQuestions?: number
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.1
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeIn",
      staggerChildren: 0.05,
      staggerDirection: -1
    },
  },
}

const progressVariants = {
  hidden: { width: 0, opacity: 0 },
  visible: {
    width: "auto",
    opacity: 1,
    transition: { duration: 0.8, ease: "easeOut" }
  }
}

/**
 * Enhanced Quiz Container Component
 *
 * Provides consistent UX patterns across all quiz types:
 * - Clean, professional layout with enhanced animations
 * - Consistent spacing and responsive design
 * - Built-in progress tracking
 * - Improved accessibility
 * - Focus mode friendly
 */
export function QuizContainer({
  children,
  animationKey,
  className,
  variant = "default",
  fullWidth = true,
  showProgress = false,
  progressValue = 0,
  questionNumber,
  totalQuestions,
}: QuizContainerProps) {
  const containerClasses = cn(
    "w-full flex flex-col",
    variant === "compact" && "max-w-3xl mx-auto",
    variant === "expanded" && "min-h-[calc(100vh-2rem)]",
    variant === "minimal" && "max-w-2xl mx-auto",
    variant === "default" && "max-w-5xl mx-auto",
    className
  )

  return (
    <div className={containerClasses}>
      {/* Modern background with gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-t from-background/80 via-background/60 to-background/40 pointer-events-none" />

      {/* Floating background elements */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-gradient-to-bl from-primary/8 to-transparent rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="fixed bottom-20 left-20 w-80 h-80 bg-gradient-to-tr from-primary/6 to-transparent rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

      {/* Progress Indicator - REMOVED for more space */}

      <AnimatePresence mode="wait">
        <motion.div
          key={animationKey}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full flex-1 flex flex-col"
        >
          {/* Content container with modern styling */}
          <div className="relative w-full space-y-8">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-primary/5 rounded-3xl" />
            </div>

            <div className="relative z-10">
              {children}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
