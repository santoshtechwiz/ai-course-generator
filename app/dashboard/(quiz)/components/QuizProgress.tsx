"use client"

import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, Clock, Target, TrendingUp, Zap, Award, Flame } from "lucide-react"
import { LoaderComponent } from "@/components/ui/loader/loader"

interface QuizProgressProps {
  currentQuestionIndex: number
  totalQuestions: number
  timeSpent: number[]
  title?: string
  quizType?: string
  animate?: boolean
  isLoading?: boolean
  streak?: number
  accuracy?: number
}

// Enhanced animation variants
const containerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
      duration: 0.6,
      ease: "easeOut",
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
}

const progressBarVariants = {
  hidden: { width: 0 },
  visible: (percentage: number) => ({
    width: `${percentage}%`,
    transition: {
      duration: 1.5,
      ease: "easeOut",
      delay: 0.5,
    },
  }),
}

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut",
    },
  },
}

export const QuizProgress: React.FC<QuizProgressProps> = ({
  currentQuestionIndex,
  totalQuestions,
  timeSpent = [],
  title = "Quiz Progress",
  quizType = "Quiz",
  animate = true,
  isLoading = false,
  streak = 0,
  accuracy = 0,
}) => {
  // Show loader if loading
  if (isLoading) {
    return <LoaderComponent isLoading={true} variant="grid" fullscreen={false} message="Loading quiz progress..." className="max-w-4xl mx-auto" />
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
        textColor: "text-green-600 dark:text-green-400",
      }
    if (percentage >= 75)
      return {
        color: "from-blue-500 to-blue-600",
        bgColor: "bg-blue-50 dark:bg-blue-950/20",
        borderColor: "border-blue-200 dark:border-blue-800",
        emoji: "🚀",
        level: "Almost there!",
        icon: TrendingUp,
        textColor: "text-blue-600 dark:text-blue-400",
      }
    if (percentage >= 50)
      return {
        color: "from-amber-500 to-amber-600",
        bgColor: "bg-amber-50 dark:bg-amber-950/20",
        borderColor: "border-amber-200 dark:border-amber-800",
        emoji: "⚡",
        level: "Halfway!",
        icon: Zap,
        textColor: "text-amber-600 dark:text-amber-400",
      }
    return {
      color: "from-primary to-primary/80",
      bgColor: "bg-primary/5",
      borderColor: "border-primary/20",
      emoji: "🎯",
      level: "Getting started",
      icon: Target,
      textColor: "text-primary",
    }
  }

  const progressData = getProgressData()

  return (
    <motion.div
      className="w-full max-w-5xl mx-auto px-4 sm:px-6"
      variants={animate ? containerVariants : {}}
      initial={animate ? "hidden" : false}
      animate={animate ? "visible" : false}
    >
      {/* Main Progress Card */}
      <motion.div
        variants={animate ? itemVariants : {}}
        className={`rounded-2xl border-2 shadow-lg overflow-hidden ${progressData.bgColor} ${progressData.borderColor}`}
        whileHover={{ scale: 1.01, y: -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Enhanced Header with Title and Subtitle */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 gap-4">
            <div className="space-y-3 flex-1 min-w-0">
              <motion.h1
                className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-foreground leading-tight break-words"
                variants={animate ? itemVariants : {}}
                style={{ wordWrap: "break-word", overflowWrap: "break-word" }}
              >
                {title}
              </motion.h1>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <motion.div
                  className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20"
                  variants={animate ? itemVariants : {}}
                  whileHover={{ scale: 1.05 }}
                >
                  <progressData.icon className="w-4 h-4" />
                  <span className="text-sm font-semibold">{quizType}</span>
                </motion.div>

                <motion.div
                  className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full border border-border/30"
                  variants={animate ? itemVariants : {}}
                >
                  {total} Questions
                </motion.div>

                {totalTimeSpent > 0 && (
                  <motion.div
                    className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-border/30"
                    variants={animate ? itemVariants : {}}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatTime(totalTimeSpent)}</span>
                  </motion.div>
                )}

                {/* Streak indicator */}
                <AnimatePresence>
                  {streak > 0 && (
                    <motion.div
                      className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full shadow-lg"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      variants={pulseVariants}
                      animate={streak > 5 ? "pulse" : ""}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span className="text-sm font-bold">{streak}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Accuracy indicator */}
                <AnimatePresence>
                  {accuracy > 0 && (
                    <motion.div
                      className="flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span className="text-sm font-bold">{Math.round(accuracy)}%</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <motion.div
              className="text-right flex-shrink-0"
              variants={animate ? itemVariants : {}}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-none">
                {current}
                <span className="text-muted-foreground text-2xl sm:text-3xl lg:text-4xl">/{total}</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">Progress</p>
            </motion.div>
          </div>

          {/* Enhanced Progress Bar Section */}
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <span className="text-base sm:text-lg font-semibold text-foreground">Progress Overview</span>
                <p className="text-sm text-muted-foreground">Track your completion</p>
              </div>
              <motion.span
                className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${progressData.color} bg-clip-text text-transparent`}
                key={percentage}
                initial={animate ? { scale: 1.2, opacity: 0 } : false}
                animate={animate ? { scale: 1, opacity: 1 } : false}
                transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
              >
                {Math.round(percentage)}%
              </motion.span>
            </div>

            {/* Main Progress Bar with enhanced animations */}
            <div className="relative h-5 sm:h-6 bg-muted/30 rounded-full overflow-hidden shadow-inner border border-border/20">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${progressData.color} shadow-lg relative overflow-hidden`}
                variants={animate ? progressBarVariants : {}}
                initial={animate ? "hidden" : { width: `${percentage}%` }}
                animate={animate ? "visible" : { width: `${percentage}%` }}
                custom={percentage}
              >
                {/* Enhanced shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
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

                {/* Pulse effect for active progress */}
                {percentage > 0 && percentage < 100 && (
                  <motion.div
                    className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 rounded-r-full"
                    animate={{
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  />
                )}
              </motion.div>

              {/* Enhanced progress milestones */}
              {[25, 50, 75].map((mark) => (
                <motion.div
                  key={mark}
                  className="absolute top-0 bottom-0 w-0.5 bg-background/80 shadow-sm"
                  style={{ left: `${mark}%` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 + mark * 0.01 }}
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

          {/* Status indicator */}
          <motion.div className="text-center mb-4" variants={animate ? itemVariants : {}}>
            <div
              className={`inline-flex items-center gap-3 px-4 py-2 rounded-full ${progressData.bgColor} border ${progressData.borderColor}`}
            >
              <motion.span
                className="text-2xl"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              >
                {progressData.emoji}
              </motion.span>
              <span className={`font-semibold ${progressData.textColor}`}>{progressData.level}</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Enhanced Additional Stats */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          variants={animate ? itemVariants : {}}
          className="bg-card rounded-xl shadow-md p-4 flex items-center space-x-3 border border-border/50 hover:shadow-lg transition-shadow"
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className={`p-3 rounded-lg ${progressData.bgColor} border ${progressData.borderColor}`}>
            <progressData.icon className={`w-5 h-5 ${progressData.textColor}`} />
          </div>
          <div>
            <h4 className="text-base font-semibold text-foreground">{progressData.level}</h4>
            <p className="text-sm text-muted-foreground">Current Status</p>
          </div>
        </motion.div>

        <motion.div
          variants={animate ? itemVariants : {}}
          className="bg-card rounded-xl shadow-md p-4 flex items-center space-x-3 border border-border/50 hover:shadow-lg transition-shadow"
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-500 border border-amber-200 dark:border-amber-800">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-foreground">{formatTime(totalTimeSpent)}</h4>
            <p className="text-sm text-muted-foreground">Total Time</p>
          </div>
        </motion.div>

        <motion.div
          variants={animate ? itemVariants : {}}
          className="bg-card rounded-xl shadow-md p-4 flex items-center space-x-3 border border-border/50 hover:shadow-lg transition-shadow"
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-500 border border-blue-200 dark:border-blue-800">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-foreground">{formatTime(avgTimePerQuestion)}</h4>
            <p className="text-sm text-muted-foreground">Avg. Time</p>
          </div>
        </motion.div>

        <motion.div
          variants={animate ? itemVariants : {}}
          className="bg-card rounded-xl shadow-md p-4 flex items-center space-x-3 border border-border/50 hover:shadow-lg transition-shadow"
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-purple-500 border border-purple-200 dark:border-purple-800">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-foreground">
              {current}/{total}
            </h4>
            <p className="text-sm text-muted-foreground">Questions</p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
