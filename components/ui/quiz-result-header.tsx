"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Award, Target, Brain, Code, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Helper functions for score color and performance level
const getScoreColor = (score: number) => {
  if (score >= 90) return "text-green-600 dark:text-green-400"
  if (score >= 80) return "text-blue-600 dark:text-blue-400"
  if (score >= 70) return "text-yellow-600 dark:text-yellow-400" 
  if (score >= 60) return "text-orange-500 dark:text-orange-400"
  return "text-red-600 dark:text-red-400"
}

const calculatePerformanceLevel = (score: number) => {
  if (score >= 90) return "Excellent"
  if (score >= 80) return "Very Good"
  if (score >= 70) return "Good"
  if (score >= 60) return "Satisfactory"
  if (score >= 50) return "Needs Improvement"
  return "Study Required"
}

interface QuizResultHeaderProps {
  title: string
  completedAt?: string
  score: number
  feedbackMessage?: string
  icon?: React.ReactNode
  scoreLabel?: string
  quizType?: "mcq" | "blanks" | "code" | "openended" | "flashcard"
  totalQuestions?: number
  correctAnswers?: number
}

export function QuizResultHeader({
  title,
  completedAt,
  score,
  feedbackMessage,
  icon,
  scoreLabel = "Score",
  quizType,
  totalQuestions,
  correctAnswers,
}: QuizResultHeaderProps) {
  // Auto-generate feedback message if not provided
  const performance = calculatePerformanceLevel(score)
  const generatedFeedbackMessage = (() => {
    if (score >= 90) return "Outstanding! You've mastered this topic."
    if (score >= 80) return "Great job! You have strong understanding."
    if (score >= 70) return "Well done! Your knowledge is solid."
    if (score >= 60) return "Good effort! Keep studying to improve."
    if (score >= 50) return "You're making progress. More study is needed."
    return "Keep learning! Review the material thoroughly."
  })()

  // Get appropriate icon based on quiz type
  const getQuizTypeIcon = () => {
    if (icon) return icon;
    
    switch (quizType) {
      case "mcq": return <Target className="h-6 w-6 text-purple-600 mr-2" />
      case "blanks": return <Brain className="h-6 w-6 text-blue-600 mr-2" />
      case "code": return <Code className="h-6 w-6 text-cyan-600 mr-2" />
      case "openended": return <div className="h-6 w-6 text-teal-600 mr-2 font-serif text-xl flex items-center justify-center">Aa</div>
      case "flashcard": return <BookOpen className="h-6 w-6 text-amber-600 mr-2" />
      default: return <Award className="h-6 w-6 text-primary mr-2" />
    }
  }
  
  const scoreColorClass = getScoreColor(score);

  return (
    <Card>
      <CardHeader className="pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center text-center"
        >
          <div className="flex items-center mb-2">
            {getQuizTypeIcon()}
            <CardTitle className="text-2xl">{title}</CardTitle>
          </div>

          {completedAt && (
            <CardDescription className="mb-4">
              Completed on {new Date(completedAt).toLocaleDateString()}
            </CardDescription>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className={`px-4 py-2 rounded-full font-medium mb-3 ${scoreColorClass.replace('text-', 'bg-').replace('-600', '-100').replace('-400', '-900/30')} ${scoreColorClass}`}
          >
            {scoreLabel}: {score}%
            {totalQuestions !== undefined && (
              <span className="text-sm ml-2 opacity-80">
                ({correctAnswers || 0}/{totalQuestions} correct)
              </span>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="flex items-center gap-2 mb-2"
          >
            <Badge variant="outline" className={scoreColorClass}>
              {performance}
            </Badge>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="text-muted-foreground max-w-md"
          >
            {feedbackMessage || generatedFeedbackMessage}
          </motion.p>
        </motion.div>
      </CardHeader>
    </Card>
  )
}
