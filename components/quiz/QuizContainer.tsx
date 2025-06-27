"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuizContainerProps {
  children: React.ReactNode
  questionNumber: number
  totalQuestions: number
  quizType: "mcq" | "openended" | "blanks" | "code" | "flashcard"
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
}: QuizContainerProps) {
  const progress = (questionNumber / totalQuestions) * 100

  const getQuizTypeInfo = () => {
    switch (quizType) {
      case "mcq":
        return { label: "Multiple Choice", color: "bg-blue-500" }
      case "openended":
        return { label: "Open Ended", color: "bg-green-500" }
      case "blanks":
        return { label: "Fill in Blanks", color: "bg-purple-500" }
      case "code":
        return { label: "Code Challenge", color: "bg-orange-500" }
      case "flashcard":
        return { label: "Flashcard", color: "bg-pink-500" }
      default:
        return { label: "Quiz", color: "bg-gray-500" }
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
        <div className="bg-muted/30 border-b border-border px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  {questionNumber}
                </span>
                <div>
                  <div className="text-sm font-medium text-foreground">
                    Question {questionNumber} of {totalQuestions}
                  </div>
                  {quizSubtitle && <div className="text-xs text-muted-foreground">{quizSubtitle}</div>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={cn("text-white text-xs", typeInfo.color)}>
                {typeInfo.label}
              </Badge>
              {timeSpent && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>
                    {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {quizTitle && (
            <div className="mt-3">
              <h1 className="text-lg font-semibold text-foreground">{quizTitle}</h1>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={cn("p-6", contentClassName)}>{children}</div>
      </div>
    </motion.div>
  )
}
