"use client"

import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Clock, Target, Brain, Code2, PenTool, BookOpen } from 'lucide-react'

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
}

const quizTypeConfig = {
  mcq: {
    icon: Target,
    label: "Multiple Choice",
    gradient: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  code: {
    icon: Code2,
    label: "Code Challenge",
    gradient: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-800",
  },
  blanks: {
    icon: PenTool,
    label: "Fill Blanks",
    gradient: "from-cyan-500 to-teal-500",
    bgColor: "bg-cyan-50 dark:bg-cyan-950/20",
    borderColor: "border-cyan-200 dark:border-cyan-800",
  },
  openended: {
    icon: Brain,
    label: "Open Ended",
    gradient: "from-violet-500 to-purple-500",
    bgColor: "bg-violet-50 dark:bg-violet-950/20",
    borderColor: "border-violet-200 dark:border-violet-800",
  },
  flashcard: {
    icon: BookOpen,
    label: "Flashcards",
    gradient: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
}

const difficultyConfig = {
  easy: { label: "Easy", color: "bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-300" },
  medium: { label: "Medium", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/20 dark:text-amber-300" },
  hard: { label: "Hard", color: "bg-red-100 text-red-800 dark:bg-red-950/20 dark:text-red-300" },
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
}

export function QuizContainer({
  children,
  questionNumber = 1,
  totalQuestions = 1,
  quizType = "mcq",
  animationKey,
  className,
  quizTitle,
  quizSubtitle,
  timeSpent = 0,
  difficulty = "medium",
  showProgress = true,
}: QuizContainerProps) {
  const config = quizTypeConfig[quizType] || quizTypeConfig.mcq
  const diffConfig = difficultyConfig[difficulty] || difficultyConfig.medium
  const IconComponent = config.icon

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progress = totalQuestions > 0 ? Math.round((questionNumber / totalQuestions) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Compact Header */}
      {/* <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg bg-gradient-to-r text-white shadow-md", config.gradient)}>
                <IconComponent className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {config.label}
                </Badge>
                <Badge variant="outline" className={cn("text-xs", diffConfig.color)}>
                  {diffConfig.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {questionNumber}/{totalQuestions}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {timeSpent > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 rounded-lg text-sm">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="font-mono">{formatTime(timeSpent)}</span>
                </div>
              )}
              <div className="text-sm font-medium text-primary">
                {progress}%
              </div>
            </div>
          </div>

          {showProgress && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Question {questionNumber} of {totalQuestions}</span>
                <span>{progress}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
      </div> */}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={animationKey}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn("w-full max-w-4xl mx-auto", className)}
          >
            <Card className={cn("border-l-4 shadow-lg", config.borderColor, config.bgColor)}>
              <CardContent className="p-6 sm:p-8">
                {children}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}