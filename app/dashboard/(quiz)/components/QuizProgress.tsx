"use client"

import type React from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Clock, Target, TrendingUp, Zap } from "lucide-react"
import { UnifiedLoader } from "./ui/unified-loader"

interface QuizProgressProps {
  currentQuestionIndex: number
  totalQuestions: number
  timeSpent: number[]
  title?: string
  quizType?: string
  animate?: boolean
  isLoading?: boolean
}

export const QuizProgress: React.FC<QuizProgressProps> = ({
  currentQuestionIndex,
  totalQuestions,
  timeSpent = [],
  title = "Quiz Progress",
  quizType = "Quiz",
  animate = true,
  isLoading = false,
}) => {
  // Show loader if loading
  if (isLoading) {
    return <UnifiedLoader variant="skeleton" message="Loading quiz progress..." className="max-w-4xl mx-auto" />
  }

  // Ensure values are valid
  const current = Math.max(0, Math.min(currentQuestionIndex + 1, totalQuestions))
  const total = Math.max(1, totalQuestions)
  const percentage = Math.min(Math.max((current / total) * 100, 0), 100)

  // Calculate total time spent - with error handling
  const totalTimeSpent = Array.isArray(timeSpent)
    ? timeSpent.reduce((acc, time) => acc + (typeof time === "number" ? time : 0), 0)
    : 0

  // Format time display with better handling
  const formatTime = (seconds: number) => {
    if (!seconds || typeof seconds !== "number" || seconds < 0) return "0s"
    if (seconds < 60) return `${Math.floor(seconds)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }

  // Calculate average time per question with validation
  const avgTimePerQuestion = timeSpent.length > 0 ? Math.round(totalTimeSpent / timeSpent.length) : 0

  // Determine progress color and performance
  const getProgressData = () => {
    if (percentage === 100)
      return {
        color: "from-green-500 to-green-600",
        bgColor: "bg-green-50 dark:bg-green-950/20",
        borderColor: "border-green-200 dark:border-green-800",
        emoji: "🎉",
        level: "Complete!",
        icon: CheckCircle2,
      }
    if (percentage >= 75)
      return {
        color: "from-blue-500 to-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950/20",
        borderColor: "border-blue-200 dark:border-blue-800",
        emoji: "🚀",
        level: "Almost there!",
        icon: TrendingUp,
      }
    if (percentage >= 50)
      return {
        color: "from-amber-500 to-amber-600",
        bgColor: "bg-amber-50 dark:bg-amber-950/20",
        borderColor: "border-amber-200 dark:border-amber-800",
        emoji: "⚡",
        level: "Halfway!",
        icon: Zap,
      }
    return {
      color: "from-primary to-primary/80",
      bgColor: "bg-primary/5",
      borderColor: "border-primary/20",
      emoji: "🎯",
      level: "Getting started",
      icon: Target,
    }
  }

  const progressData = getProgressData()

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto px-4 sm:px-6"
      initial={animate ? { opacity: 0, y: -20 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Main Progress Card */}
      <motion.div
        className={`rounded-2xl border-2 shadow-lg overflow-hidden ${progressData.bgColor} ${progressData.borderColor}`}
        whileHover={{ scale: 1.01, y: -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="p-4 sm:p-6">
          {/* Enhanced Header with Title and Subtitle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <div className="space-y-2 flex-1 min-w-0">
              <motion.h1
                className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-tight break-words"
                initial={animate ? { opacity: 0, x: -20 } : false}
                animate={animate ? { opacity: 1, x: 0 } : false}
                transition={{ delay: 0.1, duration: 0.5 }}
                style={{ wordWrap: "break-word", overflowWrap: "break-word" }}
              >
                {title}
              </motion.h1>

              <div className="flex flex-wrap items-center gap-2">
                <motion.div
                  className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20"
                  initial={animate ? { opacity: 0, scale: 0.9 } : false}
                  animate={animate ? { opacity: 1, scale: 1 } : false}
                  transition={{ delay: 0.15, duration: 0.4 }}
                >
                  <progressData.icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{quizType}</span>
                </motion.div>

                <motion.div
                  className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full"
                  initial={animate ? { opacity: 0, scale: 0.9 } : false}
                  animate={animate ? { opacity: 1, scale: 1 } : false}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  {total} Questions
                </motion.div>

                {totalTimeSpent > 0 && (
                  <motion.div
                    className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full flex items-center gap-1.5"
                    initial={animate ? { opacity: 0, scale: 0.9 } : false}
                    animate={animate ? { opacity: 1, scale: 1 } : false}
                    transition={{ delay: 0.25, duration: 0.4 }}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTime(totalTimeSpent)}</span>
                  </motion.div>
                )}
              </div>
            </div>

            <motion.div
              className="text-right flex-shrink-0"
              initial={animate ? { opacity: 0, scale: 0.8 } : false}
              animate={animate ? { opacity: 1, scale: 1 } : false}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
            >
              <div className="text-3xl sm:text-4xl font-bold text-foreground leading-none">
                {current}
                <span className="text-muted-foreground text-xl sm:text-2xl">/{total}</span>
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-1">Progress</p>
            </motion.div>
          </div>

          {/* Progress Bar Section */}
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <span className="text-base font-semibold text-foreground">Progress Overview</span>
                <p className="text-sm text-muted-foreground">Track your completion</p>
              </div>
              <motion.span
                className="text-xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"
                key={percentage}
                initial={animate ? { scale: 1.2, opacity: 0 } : false}
                animate={animate ? { scale: 1, opacity: 1 } : false}
                transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
              >
                {Math.round(percentage)}%
              </motion.span>
            </div>

            {/* Main Progress Bar */}
            <div className="relative h-4 bg-muted/30 rounded-full overflow-hidden shadow-inner border border-border/20">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${progressData.color} shadow-lg relative overflow-hidden`}
                initial={animate ? { width: 0 } : { width: `${percentage}%` }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              >
                {/* Animated shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  animate={{
                    x: ["-100%", "100%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "loop",
                    ease: "linear",
                    repeatDelay: 1,
                  }}
                  style={{ opacity: percentage > 0 ? 1 : 0 }}
                />
              </motion.div>

              {/* Progress milestones */}
              {[25, 50, 75].map((mark) => (
                <motion.div
                  key={mark}
                  className="absolute top-0 bottom-0 w-0.5 bg-background/60 shadow-sm"
                  style={{ left: `${mark}%` }}
                />
              ))}
            </div>

            {/* Progress milestones labels */}
            <div className="flex justify-between items-center text-xs font-medium text-muted-foreground px-1">
              <span>Start</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>Complete</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Additional Stats */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <motion.div
          className="bg-card rounded-xl shadow-md p-3 flex items-center space-x-3 border border-border/50"
          initial={animate ? { opacity: 0, y: 20 } : false}
          animate={animate ? { opacity: 1, y: 0 } : false}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className={`p-2 rounded-lg text-white ${progressData.bgColor}`}>
            <progressData.icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-foreground">{progressData.level}</h4>
            <p className="text-sm text-muted-foreground">Current Status</p>
          </div>
        </motion.div>

        <motion.div
          className="bg-card rounded-xl shadow-md p-3 flex items-center space-x-3 border border-border/50"
          initial={animate ? { opacity: 0, y: 20 } : false}
          animate={animate ? { opacity: 1, y: 0 } : false}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-foreground">{formatTime(totalTimeSpent)}</h4>
            <p className="text-sm text-muted-foreground">Total Time</p>
          </div>
        </motion.div>

        <motion.div
          className="bg-card rounded-xl shadow-md p-3 flex items-center space-x-3 border border-border/50"
          initial={animate ? { opacity: 0, y: 20 } : false}
          animate={animate ? { opacity: 1, y: 0 } : false}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-500">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-foreground">{formatTime(avgTimePerQuestion)}</h4>
            <p className="text-sm text-muted-foreground">Avg. Time</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
