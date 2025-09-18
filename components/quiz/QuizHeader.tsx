"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Brain, Clock, Target, Users, BookOpen, Code2, PenTool } from "lucide-react"

interface QuizHeaderProps {
  title: string
  subtitle?: string
  quizType: string
  totalQuestions: number
  currentQuestion: number
  difficulty?: string
  timeLimit?: number
  category?: string
  animate?: boolean
  className?: string
}

export function QuizHeader({
  title,
  subtitle,
  quizType,
  totalQuestions,
  currentQuestion,
  difficulty,
  timeLimit,
  category,
  animate = true,
  className = "",
}: QuizHeaderProps) {
  const getQuizIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "mcq":
      case "multiple choice":
        return Target
      case "code":
      case "coding":
        return Code2
      case "blanks":
      case "fill in the blanks":
        return PenTool
      case "openended":
      case "open ended":
        return Brain
      case "flashcard":
      case "flashcards":
        return BookOpen
      default:
        return Brain
    }
  }

  const getDifficultyColor = (diff?: string) => {
    switch (diff?.toLowerCase()) {
      case "easy":
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800"
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800"
      case "hard":
        return "bg-accent/10 text-accent-foreground border-accent/20 dark:bg-accent/20 dark:text-accent-foreground dark:border-accent/30"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const QuizIcon = getQuizIcon(quizType)

  return (
    <motion.div
      className={`relative w-full overflow-hidden ${className}`}
      initial={animate ? { opacity: 0, y: -40 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Background with gradient and pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent rounded-3xl" />
      <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-card/90 to-card/95 backdrop-blur-xl rounded-3xl border border-border/30" />

      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl transform translate-x-32 -translate-y-32 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary/8 to-transparent rounded-full blur-2xl transform -translate-x-24 translate-y-24 animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative shadow-2xl border border-border/20 rounded-3xl bg-card/80 backdrop-blur-sm p-6 sm:p-8 lg:p-10">
        {/* Top Row: Title & Badges */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent tracking-tight flex items-center gap-4 mb-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-lg" />
                  <div className="relative bg-gradient-to-br from-primary to-primary/80 p-3 sm:p-4 rounded-2xl shadow-xl shadow-primary/30">
                    <QuizIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                  </div>
                </div>
                <span className="truncate leading-tight">{title}</span>
              </h1>
              {subtitle && (
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground/80 font-medium leading-relaxed">
                  {subtitle}
                </p>
              )}
            </motion.div>
          </div>

          <motion.div
            className="flex flex-wrap gap-3 lg:justify-end items-center"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Badge className="bg-gradient-to-r from-primary/15 to-primary/10 text-primary border border-primary/30 font-semibold px-4 py-2.5 rounded-full text-sm shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all duration-300">
              <QuizIcon className="w-4 h-4 mr-2" />
              {quizType}
            </Badge>

            <Badge className="bg-gradient-to-r from-muted/60 to-muted/40 text-foreground border-border/50 font-semibold px-4 py-2.5 rounded-full flex items-center gap-2 text-sm shadow-md hover:shadow-lg transition-all duration-300">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Questions:</span>
              <span className="font-bold text-primary">{totalQuestions}</span>
            </Badge>

            {difficulty && (
              <Badge className={`px-4 py-2.5 border text-sm font-bold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ${getDifficultyColor(difficulty)}`}>
                <Target className="w-4 h-4 mr-2" />
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Badge>
            )}

            {timeLimit && (
              <Badge className="bg-gradient-to-r from-blue-500/15 to-blue-600/10 text-blue-700 dark:text-blue-300 border-blue-200/50 dark:border-blue-700/50 px-4 py-2.5 rounded-full font-semibold text-sm shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300">
                <Clock className="w-4 h-4 mr-2" />
                {timeLimit} min
              </Badge>
            )}

            {category && (
              <Badge className="bg-gradient-to-r from-purple-500/15 to-purple-600/10 text-purple-700 dark:text-purple-300 border-purple-200/50 dark:border-purple-700/50 px-4 py-2.5 rounded-full font-semibold text-sm shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all duration-300">
                <BookOpen className="w-4 h-4 mr-2" />
                {category}
              </Badge>
            )}
          </motion.div>
        </div>

        {/* Enhanced Progress Section */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="flex items-center justify-between text-sm lg:text-base">
            <span className="text-muted-foreground/80 font-semibold">
              {/* Question counter removed for cleaner layout */}
            </span>
            <span className="text-primary font-bold text-lg">
              {Math.round((currentQuestion / totalQuestions) * 100)}% Complete
            </span>
          </div>

          <div className="relative">
            {/* Background track */}
            <div className="h-3 w-full bg-gradient-to-r from-muted/40 to-muted/20 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-muted/60 to-muted/30 rounded-full" />
            </div>

            {/* Progress bar */}
            <motion.div
              className="absolute top-0 left-0 h-3 bg-gradient-to-r from-primary via-primary to-primary/80 rounded-full shadow-lg shadow-primary/30 overflow-hidden"
              initial={{ width: 0 }}
              animate={{ width: `${Math.round((currentQuestion / totalQuestions) * 100)}%` }}
              transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Animated shine effect */}
              <motion.div
                className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['0%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              />
            </motion.div>

            {/* Progress milestones */}
            {Array.from({ length: totalQuestions }, (_, i) => (
              <motion.div
                key={i}
                className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 transition-all duration-300 ${
                  i < currentQuestion - 1
                    ? 'bg-primary border-primary shadow-lg shadow-primary/40'
                    : i === currentQuestion - 1
                      ? 'bg-primary/80 border-primary/60 shadow-md'
                      : 'bg-muted border-border/50'
                }`}
                style={{ left: `${(i / (totalQuestions - 1)) * 100}%` }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default QuizHeader
