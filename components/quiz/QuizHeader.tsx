"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Brain, Clock, Target, Users, BookOpen } from "lucide-react"

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
        return BookOpen
      case "blanks":
      case "fill in the blanks":
        return Brain
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
      className={`w-full shadow-xl border border-border/30 rounded-3xl bg-white/70 dark:bg-card/70 backdrop-blur-md p-6 sm:p-8 mb-6 transition-all ${className}`}
      initial={animate ? { opacity: 0, y: -30 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Top Row: Title & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
            <QuizIcon className="w-5 h-5 text-primary" />
            {title}
          </h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap gap-2 justify-end items-center">
          <Badge className="bg-primary/10 text-primary border border-primary/30 font-medium px-3 py-1 rounded-full">
            {quizType}
          </Badge>

          <Badge className="bg-muted/40 text-foreground border-border font-medium px-3 py-1 rounded-full flex items-center gap-1">
            <Users className="w-4 h-4" />
            {totalQuestions} Questions
          </Badge>

          {difficulty && (
            <Badge className={`px-3 py-1 border text-sm font-medium rounded-full ${getDifficultyColor(difficulty)}`}>
              {difficulty}
            </Badge>
          )}

          {timeLimit && (
            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800 px-3 py-1 rounded-full font-medium">
              <Clock className="w-4 h-4 inline mr-1" />
              {timeLimit} min
            </Badge>
          )}

          {category && (
            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800 px-3 py-1 rounded-full font-medium">
              <BookOpen className="w-4 h-4 inline mr-1" />
              {category}
            </Badge>
          )}
        </div>
      </div>

      {/* Progress Line */}
      <div className="mt-6">
        <p className="text-center text-sm text-muted-foreground font-medium mb-2">
          Question <span className="font-bold text-primary">{currentQuestion}</span> of{" "}
          <span className="font-semibold">{totalQuestions}</span> ·{" "}
          {Math.round((currentQuestion / totalQuestions) * 100)}% Complete
        </p>
        <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.round((currentQuestion / totalQuestions) * 100)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  )
}
export default QuizHeader