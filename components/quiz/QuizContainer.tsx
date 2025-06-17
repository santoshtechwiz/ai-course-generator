"use client"

import { motion, AnimatePresence } from "framer-motion"
import type React from "react"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { QuizHeader } from "@/components/quiz/QuizHeader" // Adjust the import path as needed

interface QuizContainerProps {
  children: React.ReactNode
  questionNumber: number
  totalQuestions: number
  quizType?: string
  progressPercentage?: number
  animationKey?: string | number
  className?: string
  timeElapsed?: number
  showTimer?: boolean
  quizTitle: string
  quizSubtitle?: string
  difficulty?: string
  category?: string
  timeLimit?: number
}

export function QuizContainer({
  children,
  questionNumber,
  totalQuestions,
  quizType = "Quiz",
  animationKey,
  className,
  timeElapsed,
  showTimer = false,
  quizTitle,
  quizSubtitle,
  difficulty,
  category,
  timeLimit,
}: QuizContainerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-2xl">
          <div className="h-4 bg-muted rounded-full w-full" />
          <div className="h-32 bg-muted rounded-2xl" />
          <div className="space-y-2">
            <div className="h-12 bg-muted rounded-xl" />
            <div className="h-12 bg-muted rounded-xl" />
            <div className="h-12 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <QuizHeader
        title={quizTitle}
        subtitle={quizSubtitle}
        quizType={quizType}
        totalQuestions={totalQuestions}
        currentQuestion={questionNumber}
        difficulty={difficulty}
        timeLimit={timeLimit}
        category={category}
        animate
      />

      {/* Main Quiz Card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={animationKey || questionNumber}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{
              duration: 0.4,
              ease: [0.23, 1, 0.32, 1],
            }}
            className={cn("w-full", className)}
          >
            <Card className="bg-card/60 backdrop-blur-sm border border-border/50 shadow-xl rounded-3xl overflow-hidden">
              <div className="p-6 sm:p-8">{children}</div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
