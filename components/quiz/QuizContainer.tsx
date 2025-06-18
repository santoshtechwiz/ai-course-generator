"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"
import type React from "react"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { QuizHeader } from "@/components/quiz/QuizHeader"
import { Progress } from "@/components/ui/progress"

interface QuizContainerProps {
  children: React.ReactNode
  questionNumber: number
  totalQuestions: number
  quizType?: string
  animationKey?: string | number
  className?: string
  contentClassName?: string
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
  contentClassName,
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

  const progress = totalQuestions > 0 ? (questionNumber / totalQuestions) * 100 : 0

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
    <div className="min-h-screen bg-background py-4 sm:py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Cleaner Header */}
        <QuizHeader
          title={quizTitle}
          subtitle={quizSubtitle}
          quizType={quizType}
          totalQuestions={totalQuestions}
          currentQuestion={questionNumber}
          difficulty={difficulty}
          timeLimit={timeLimit}
          category={category}
          className="rounded-xl px-4 py-4 sm:px-6 sm:py-5 shadow-none border bg-card"
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={animationKey || questionNumber}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className={cn("mt-6", className)}
          >
            <Card className="bg-card/60 backdrop-blur-sm border border-border/50 shadow-xl rounded-2xl overflow-hidden">
              <div className="p-6 sm:p-8 flex flex-col min-h-[400px]">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Question {questionNumber} of {totalQuestions}
                  </h3>
                  <span className="text-xs font-medium uppercase text-muted-foreground bg-muted px-2 py-1 rounded">
                    {quizType}
                  </span>
                </div>

                <Progress value={progress} className="h-2 mb-6" />

                <div className={cn("flex-1", contentClassName)}>{children}</div>
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
