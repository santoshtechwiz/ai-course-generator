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
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800"
      case "hard":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const QuizIcon = getQuizIcon(quizType)

  return (
    <motion.div
      className={`w-full shadow-lg border border-border/20 rounded-2xl bg-card/80 backdrop-blur-sm p-6 sm:p-8 mb-6 transition-all ${className}`}
      initial={animate ? { opacity: 0, y: -30 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Top Row: Title & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground tracking-tight flex items-center gap-3 mb-2">
            <QuizIcon className="w-6 h-6 sm:w-7 sm:h-7 text-primary flex-shrink-0" />
            <span className="truncate">{title}</span>
          </h1>
          {subtitle && <p className="text-sm sm:text-base text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end items-center">
          <Badge className="bg-primary/10 text-primary border border-primary/30 font-medium px-3 py-1.5 rounded-full text-xs sm:text-sm">
            {quizType}
          </Badge>

          <Badge className="bg-muted/40 text-foreground border-border font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs sm:text-sm">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Questions:</span>
            <span className="font-semibold">{totalQuestions}</span>
          </Badge>

          {difficulty && (
            <Badge className={`px-3 py-1.5 border text-xs sm:text-sm font-medium rounded-full ${getDifficultyColor(difficulty)}`}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Badge>
          )}

          {timeLimit && (
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-full font-medium text-xs sm:text-sm">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              {timeLimit} min
            </Badge>
          )}

          {category && (
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800 px-3 py-1.5 rounded-full font-medium text-xs sm:text-sm">
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              {category}
            </Badge>
          )}
        </div>
      </div>

      {/* Progress Section */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-medium">
            Question <span className="font-bold text-primary">{currentQuestion}</span> of{" "}
            <span className="font-semibold">{totalQuestions}</span>
          </span>
          <span className="text-primary font-semibold">
            {Math.round((currentQuestion / totalQuestions) * 100)}% Complete
          </span>
        </div>
        
        <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.round((currentQuestion / totalQuestions) * 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  )
}

export default QuizHeader
