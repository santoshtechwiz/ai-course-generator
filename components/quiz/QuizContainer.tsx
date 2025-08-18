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
    bgColor: "",
    borderColor: "",
    accentColor: "",
  },
  code: {
    icon: Code2,
    label: "Code Challenge",
    bgColor: "",
    borderColor: "",
    accentColor: "",
  },
  blanks: {
    icon: PenTool,
    label: "Fill Blanks",
    bgColor: "",
    borderColor: "",
    accentColor: "",
  },
  openended: {
    icon: Brain,
    label: "Open Ended",
    bgColor: "",
    borderColor: "",
    accentColor: "",
  },
  flashcard: {
    icon: BookOpen,
    label: "Flashcards",
    bgColor: "",
    borderColor: "",
    accentColor: "",
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
 * - Clean, professional layout
 * - Consistent spacing and responsive design
 * - Minimal nesting for better performance
 * - Focus mode friendly
 */
export function QuizContainer({
  children,
  questionNumber = 1,
  totalQuestions = 1,
  quizType = "mcq",
  animationKey,
  className,
  fullWidth = true,
  variant = "default",
}: QuizContainerProps) {
  const config = quizTypeConfig[quizType] || quizTypeConfig.mcq

  const containerClasses = cn(
    "w-full flex flex-col",
    variant === "compact" && "max-w-3xl mx-auto",
    variant === "expanded" && "min-h-[calc(100vh-2rem)]",
    variant === "default" && "max-w-4xl mx-auto",
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
          {/* Simplified container - no unnecessary nesting */}
          <div className="w-full space-y-6">
            {children}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
