"use client"

import type React from "react"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface QuizContainerProps {
  children: React.ReactNode
  questionNumber?: number
  totalQuestions?: number
  progressPercentage?: number
  quizType?: string
  animationKey?: string | number
  className?: string
}

export function QuizContainer({
  children,
  questionNumber = 1,
  totalQuestions = 1,
  progressPercentage,
  quizType = "Quiz",
  animationKey,
  className,
}: QuizContainerProps) {
  const calculatedProgress = progressPercentage ?? Math.round((questionNumber / totalQuestions) * 100)

  return (
    <motion.div
      key={animationKey}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
        layout: { duration: 0.3 },
      }}
      className={cn("w-full max-w-4xl mx-auto", className)}
    >
      {/* Enhanced Header with gradient background */}
      <motion.div
        className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-2 border-primary/20 rounded-t-3xl p-6 shadow-lg"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.div
              className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg"
              animate={{
                boxShadow: [
                  "0 4px 6px -1px rgba(var(--primary), 0.1)",
                  "0 10px 15px -3px rgba(var(--primary), 0.2)",
                  "0 4px 6px -1px rgba(var(--primary), 0.1)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            >
              <span className="text-primary-foreground font-bold text-lg">{quizType.charAt(0).toUpperCase()}</span>
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {quizType} Quiz
              </h2>
              <motion.div
                className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          {/* Enhanced Question Counter */}
          <motion.div
            className="text-right"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="text-3xl font-black text-primary">
              {questionNumber}
              <span className="text-muted-foreground">/{totalQuestions}</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Questions</p>
          </motion.div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-foreground">Progress</span>
            <motion.span
              className="text-sm font-bold text-primary"
              key={calculatedProgress}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {calculatedProgress}%
            </motion.span>
          </div>
          <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-primary/80 to-primary rounded-full shadow-lg"
              initial={{ width: 0 }}
              animate={{ width: `${calculatedProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            {/* Animated shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
                repeatDelay: 1,
              }}
              style={{ opacity: calculatedProgress > 0 ? 1 : 0 }}
            />
          </div>
        </div>
      </motion.div>

      {/* Enhanced Content Area */}
      <motion.div
        className="bg-gradient-to-br from-background via-background to-muted/10 border-x-2 border-primary/20 p-8 shadow-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
