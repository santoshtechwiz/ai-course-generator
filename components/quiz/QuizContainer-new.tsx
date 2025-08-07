"use client"

import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Target, Code2, PenTool, Brain, BookOpen,
} from 'lucide-react'

interface QuizContainerProps {
  children: React.ReactNode
  questionNumber?: number
  totalQuestions?: number
  quizType?: "mcq" | "code" | "blanks" | "openended" | "flashcard"
  animationKey?: string
  className?: string
  quizTitle?: string
  quizSubtitle?: string
  timeSpent?: number
  difficulty?: "easy" | "medium" | "hard"
  showProgress?: boolean
  fullWidth?: boolean
  variant?: "default" | "compact" | "expanded"
}

const quizTypeConfig = {
  mcq: {
    icon: Target,
    label: "Multiple Choice",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    accentColor: "text-blue-600 dark:text-blue-400",
  },
  code: {
    icon: Code2,
    label: "Code Challenge",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
    accentColor: "text-green-600 dark:text-green-400",
  },
  blanks: {
    icon: PenTool,
    label: "Fill Blanks",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
    borderColor: "border-cyan-200 dark:border-cyan-800",
    accentColor: "text-cyan-600 dark:text-cyan-400",
  },
  openended: {
    icon: Brain,
    label: "Open Ended",
    bgColor: "bg-violet-50 dark:bg-violet-950/20",
    borderColor: "border-violet-200 dark:border-violet-800",
    accentColor: "text-violet-600 dark:text-violet-400",
  },
  flashcard: {
    icon: BookOpen,
    label: "Flashcards",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
    accentColor: "text-orange-600 dark:text-orange-400",
  },
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
 * - Full-width responsive layout
 * - Consistent spacing and animations
 * - Type-specific styling with shared patterns
 * - Flexible variants for different use cases
 */
export function QuizContainer({
  children,
  questionNumber = 1,
  totalQuestions = 1,
  quizType = "mcq",
  animationKey,
  className,
  fullWidth = true, // Default to true for consistent full-width behavior
  variant = "default",
}: QuizContainerProps) {
  const config = quizTypeConfig[quizType] || quizTypeConfig.mcq

  // Always use full width for consistent UX across all quiz types
  const containerClasses = cn(
    "w-full min-h-screen flex flex-col",
    variant === "compact" && "min-h-[80vh]",
    variant === "expanded" && "min-h-[calc(100vh-2rem)]",
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
          className="w-full flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-6"
        >
          {/* Full-width container with consistent padding */}
          <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col">
            <Card className="border-0 shadow-none bg-transparent flex-1">
              <CardContent className="w-full p-0 flex-1 flex flex-col">
                <div className="w-full flex-1 flex flex-col space-y-6">
                  {children}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
