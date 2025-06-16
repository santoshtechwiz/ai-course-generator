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
      className="w-full space-y-6"
      initial={animate ? { opacity: 0, y: -15 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Header Section - Enhanced */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <motion.h3
            className="text-2xl font-bold text-foreground bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
            initial={animate ? { opacity: 0, x: -20 } : false}
            animate={animate ? { opacity: 1, x: 0 } : false}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            {title}
          </motion.h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <motion.span
              className={`px-4 py-2 rounded-full text-sm font-bold border-2 shadow-md ${performanceBadge.className}`}
              initial={animate ? { scale: 0, opacity: 0 } : false}
              animate={animate ? { scale: 1, opacity: 1 } : false}
              transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 25 }}
              whileHover={{ scale: 1.05 }}
            >
              <motion.span
                className="inline-block mr-2"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 3,
                }}
              >
                <performanceBadge.icon className="w-4 h-4 inline" />
              </motion.span>
              {performanceBadge.text}
            </motion.span>
            {totalTimeSpent > 0 && (
              <motion.div
                className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full"
                initial={animate ? { opacity: 0, x: 20 } : false}
                animate={animate ? { opacity: 1, x: 0 } : false}
                transition={{ delay: 0.3, duration: 0.4 }}
              >
                <Clock className="w-4 h-4" />
                <span className="font-medium">{formatTime(totalTimeSpent)}</span>
              </motion.div>
            )}
          </div>
        </div>

        <motion.div
          className="text-right"
          initial={animate ? { opacity: 0, scale: 0.8 } : false}
          animate={animate ? { opacity: 1, scale: 1 } : false}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
        >
          <div className="text-4xl font-black text-foreground">
            {current}
            <span className="text-muted-foreground">/{total}</span>
          </div>
          <p className="text-sm text-muted-foreground font-medium">Questions</p>
        </motion.div>
      </div>

      {/* Progress Section - Enhanced */}
      <div className="space-y-4">
        {/* Main Progress Bar */}
        <div className="relative">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-bold text-foreground">Progress</span>
            <motion.span
              className="text-lg font-black text-primary"
              key={percentage}
              initial={animate ? { scale: 1.3, opacity: 0 } : false}
              animate={animate ? { scale: 1, opacity: 1 } : false}
              transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
            >
              {Math.round(percentage)}%
            </motion.span>
          </div>

          <div className="relative h-4 bg-muted/50 rounded-full overflow-hidden shadow-inner">
            <motion.div
              className={`h-full rounded-full ${getProgressColor()} shadow-lg`}
              initial={animate ? { width: 0 } : { width: `${percentage}%` }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />

            {/* Enhanced shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 2.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "loop",
                ease: "linear",
                repeatDelay: 1.5,
              }}
              style={{ opacity: percentage > 0 ? 1 : 0 }}
            />

            {/* Milestone markers */}
            {[25, 50, 75].map((mark) => (
              <motion.div
                key={mark}
                className="absolute top-0 bottom-0 w-0.5 bg-background/70 shadow-sm"
                style={{ left: `${mark}%` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              />
            ))}
          </div>

          {/* Milestone Achievement - Enhanced */}
          <AnimatePresence>
            {milestone && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="absolute -top-12 right-0 flex items-center gap-2 px-4 py-2 bg-background border-2 border-border rounded-xl shadow-lg"
              >
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.6, repeat: 2 }}>
                  <milestone.icon className={`w-4 h-4 ${milestone.color}`} />
                </motion.div>
                <span className={`text-sm font-bold ${milestone.color}`}>{milestone.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Question Indicators - Enhanced */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: Math.min(total, 12) }).map((_, i) => {
              const isCompleted = i < current - 1
              const isCurrent = i === current - 1
              const isUpcoming = i >= current

              return (
                <motion.div
                  key={i}
                  className={`
                    w-3 h-3 rounded-full transition-all duration-400 shadow-sm
                    ${
                      isCompleted
                        ? "bg-emerald-500 scale-110 shadow-emerald-500/30"
                        : isCurrent
                          ? "bg-primary scale-125 ring-3 ring-primary/40 shadow-primary/30"
                          : "bg-muted scale-100"
                    }
                  `}
                  initial={animate ? { scale: 0.6, opacity: 0.4 } : false}
                  animate={
                    animate
                      ? {
                          scale: isCurrent ? 1.25 : isCompleted ? 1.1 : 1,
                          opacity: 1,
                        }
                      : false
                  }
                  transition={{
                    duration: 0.4,
                    delay: i * 0.05,
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                  }}
                  whileHover={{ scale: isCurrent ? 1.4 : isCompleted ? 1.2 : 1.1 }}
                />
              )
            })}
            {total > 12 && <span className="text-sm text-muted-foreground ml-3 font-medium">+{total - 12} more</span>}
          </div>

          {/* Stats - Enhanced */}
          {avgTimePerQuestion > 0 && (
            <motion.div
              className="text-sm text-muted-foreground flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-full"
              initial={animate ? { opacity: 0, x: 20 } : false}
              animate={animate ? { opacity: 1, x: 0 } : false}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              <Clock className="w-4 h-4" />
              <span className="font-medium">~{formatTime(avgTimePerQuestion)}/q</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Completion Celebration - Enhanced */}
      <AnimatePresence>
        {percentage === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 dark:from-emerald-950/30 dark:via-green-950/30 dark:to-emerald-950/30 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center gap-4">
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center shadow-lg"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                }}
              >
                <CheckCircle2 className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h4 className="font-bold text-xl text-emerald-800 dark:text-emerald-200">Quiz Completed! 🎉</h4>
                <p className="text-lg text-emerald-600 dark:text-emerald-300">
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
