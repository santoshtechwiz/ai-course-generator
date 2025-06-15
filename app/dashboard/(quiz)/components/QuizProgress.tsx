"use client"

import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Clock, Target, TrendingUp } from "lucide-react"

interface QuizProgressProps {
  currentQuestionIndex: number
  totalQuestions: number
  timeSpent: number[]
  title?: string
  quizType?: string
  animate?: boolean
}

export const QuizProgress: React.FC<QuizProgressProps> = ({
  currentQuestionIndex,
  totalQuestions,
  timeSpent = [],
  title = "Quiz Progress",
  quizType = "Quiz",
  animate = true,
}) => {
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

  // Determine progress color based on completion
  const getProgressColor = () => {
    if (percentage === 100) return "bg-gradient-to-r from-emerald-500 to-emerald-600"
    if (percentage >= 75) return "bg-gradient-to-r from-blue-500 to-blue-600"
    if (percentage >= 50) return "bg-gradient-to-r from-amber-500 to-amber-600"
    return "bg-gradient-to-r from-primary to-primary/80"
  }

  // Check if we've hit a milestone
  const getMilestone = () => {
    if (percentage === 100) return { icon: CheckCircle2, text: "Complete!", color: "text-green-600" }
    if (percentage >= 75) return { icon: TrendingUp, text: "Almost there!", color: "text-blue-600" }
    if (percentage >= 50) return { icon: Target, text: "Halfway!", color: "text-yellow-600" }
    return null
  }

  const getPerformanceBadge = () => {
    if (percentage === 100)
      return {
        icon: CheckCircle2,
        text: "Perfect!",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
      }
    if (percentage >= 75)
      return {
        icon: TrendingUp,
        text: "Excellent!",
        className: "bg-blue-100 text-blue-700 border-blue-200",
      }
    if (percentage >= 50)
      return {
        icon: Target,
        text: "Good Progress!",
        className: "bg-amber-100 text-amber-700 border-amber-200",
      }
    return {
      icon: Target,
      text: "Keep Going!",
      className: "bg-gray-100 text-gray-700 border-gray-200",
    }
  }

  const performanceBadge = getPerformanceBadge()

  const milestone = getMilestone()

  return (
    <motion.div
      className="w-full space-y-4"
      initial={animate ? { opacity: 0, y: -10 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.5 }}
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${performanceBadge.className}`}>
              <performanceBadge.icon className="w-3 h-3 inline mr-1" />
              {performanceBadge.text}
            </span>
            {totalTimeSpent > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatTime(totalTimeSpent)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-foreground">
            {current}
            <span className="text-muted-foreground">/{total}</span>
          </div>
          <p className="text-xs text-muted-foreground">Questions</p>
        </div>
      </div>

      {/* Progress Section */}
      <div className="space-y-3">
        {/* Main Progress Bar */}
        <div className="relative">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">Progress</span>
            <motion.span
              className="text-sm font-bold text-primary"
              key={percentage}
              initial={animate ? { scale: 1.2, opacity: 0 } : false}
              animate={animate ? { scale: 1, opacity: 1 } : false}
              transition={{ duration: 0.3 }}
            >
              {Math.round(percentage)}%
            </motion.span>
          </div>

          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${getProgressColor()}`}
              initial={animate ? { width: 0 } : { width: `${percentage}%` }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />

            {/* Add a subtle shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
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

            {/* Milestone markers */}
            {[25, 50, 75].map((mark) => (
              <div key={mark} className="absolute top-0 bottom-0 w-0.5 bg-background/50" style={{ left: `${mark}%` }} />
            ))}
          </div>

          {/* Milestone Achievement */}
          <AnimatePresence>
            {milestone && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="absolute -top-8 right-0 flex items-center gap-1 px-2 py-1 bg-background border border-border rounded-md shadow-sm"
              >
                <milestone.icon className={`w-3 h-3 ${milestone.color}`} />
                <span className={`text-xs font-medium ${milestone.color}`}>{milestone.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Question Indicators */}
        <div className="flex justify-between items-center">
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: Math.min(total, 10) }).map((_, i) => {
              const isCompleted = i < current - 1
              const isCurrent = i === current - 1
              const isUpcoming = i >= current

              return (
                <motion.div
                  key={i}
                  className={`
                    w-2 h-2 rounded-full transition-all duration-300
                    ${
                      isCompleted
                        ? "bg-green-500 scale-110"
                        : isCurrent
                          ? "bg-primary scale-125 ring-2 ring-primary/30"
                          : "bg-muted scale-100"
                    }
                  `}
                  initial={animate ? { scale: 0.8, opacity: 0.5 } : false}
                  animate={
                    animate
                      ? {
                          scale: isCurrent ? 1.25 : isCompleted ? 1.1 : 1,
                          opacity: 1,
                        }
                      : false
                  }
                  transition={{
                    duration: 0.3,
                    delay: i * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                />
              )
            })}
            {total > 10 && <span className="text-xs text-muted-foreground ml-2">+{total - 10} more</span>}
          </div>

          {/* Stats */}
          {avgTimePerQuestion > 0 && (
            <motion.div
              className="text-xs text-muted-foreground flex items-center gap-1"
              initial={animate ? { opacity: 0 } : false}
              animate={animate ? { opacity: 1 } : false}
              transition={{ delay: 0.5 }}
            >
              <Clock className="w-3 h-3" />
              <span>~{formatTime(avgTimePerQuestion)}/q</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Completion Celebration */}
      <AnimatePresence>
        {percentage === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 shadow-md"
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              >
                <CheckCircle2 className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h4 className="font-semibold text-green-800 dark:text-green-200">Quiz Completed!</h4>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Great job finishing all {total} questions
                  {totalTimeSpent > 0 && ` in ${formatTime(totalTimeSpent)}`}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
