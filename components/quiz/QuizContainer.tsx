"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuizType } from "@/app/types/quiz-types"

interface QuizContainerProps {
  children: React.ReactNode
  questionNumber: number
  totalQuestions: number
  quizType: QuizType
  animationKey?: string | number
  className?: string
  contentClassName?: string
  quizTitle?: string
  quizSubtitle?: string
  timeSpent?: number
  difficulty?: "easy" | "medium" | "hard"
}

export function QuizContainer({
  children,
  questionNumber,
  totalQuestions,
  quizType,
  animationKey,
  className,
  contentClassName,
  quizTitle,
  quizSubtitle,
  timeSpent,
  difficulty,
}: QuizContainerProps) {
  const progress = (questionNumber / totalQuestions) * 100

  const getQuizTypeInfo = () => {
    switch (quizType) {
      case "mcq":
        return { label: "Multiple Choice", color: "bg-primary" }
      case "openended":
        return { label: "Open Ended", color: "bg-secondary" }
      case "blanks":
        return { label: "Fill in Blanks", color: "bg-purple-500 dark:bg-purple-400" }
      case "code":
        return { label: "Code Challenge", color: "bg-orange-500 dark:bg-orange-400" }
      case "flashcard":
        return { label: "Flashcard", color: "bg-pink-500 dark:bg-pink-400" }
      default:
        return { label: "Quiz", color: "bg-muted" }
    }
  }

  const typeInfo = getQuizTypeInfo()

  return (
    <motion.div
      key={animationKey}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className={cn("w-full max-w-4xl mx-auto", className)}
    >
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-muted/30 dark:bg-muted border-b border-border px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground rounded-full w-7 h-7 flex items-center justify-center font-semibold text-xs">
                {questionNumber}
              </span>
              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground">
                  Question {questionNumber} of {totalQuestions}
                </div>
                {quizSubtitle && (
                  <div className="text-xs text-muted-foreground">
                    {quizSubtitle}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={cn("text-primary-foreground text-xs", typeInfo.color)}>
                {typeInfo.label}
              </Badge>
              {difficulty && (
                <Badge variant="outline" className="text-xs capitalize text-muted-foreground border-muted-foreground">
                  {difficulty}
                </Badge>
              )}
              {typeof timeSpent === "number" && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>
                    {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {quizTitle && (
            <div className="mt-3">
              <h1 className="text-base font-semibold text-foreground">{quizTitle}</h1>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Content */}
        <div className={cn("p-6 bg-background text-foreground", contentClassName)}>{children}</div>
      </div>
    </motion.div>
  )
}
