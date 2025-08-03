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
}

const quizTypeConfig = {
  mcq: {
    icon: Target,
    label: "Multiple Choice",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  code: {
    icon: Code2,
    label: "Code Challenge",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
  },
  blanks: {
    icon: PenTool,
    label: "Fill Blanks",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
    borderColor: "border-cyan-200 dark:border-cyan-800",
  },
  openended: {
    icon: Brain,
    label: "Open Ended",
    bgColor: "bg-violet-50 dark:bg-violet-950/20",
    borderColor: "border-violet-200 dark:border-violet-800",
  },
  flashcard: {
    icon: BookOpen,
    label: "Flashcards",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
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

export function QuizContainer({
  children,
  questionNumber = 1,
  totalQuestions = 1,
  quizType = "mcq",
  animationKey,
  className,
  fullWidth = false,
}: QuizContainerProps) {
  const config = quizTypeConfig[quizType] || quizTypeConfig.mcq

  return (
    <div className="w-full flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={animationKey}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "w-full flex flex-col",
            fullWidth ? "" : "max-w-4xl mx-auto",
            className
          )}
        >
          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="w-full p-0">
              <div className="w-full flex flex-col space-y-4">
                {children}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
