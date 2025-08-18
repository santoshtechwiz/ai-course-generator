"use client"
import { motion } from "framer-motion"
import { Progress } from "@/components/ui/progress"
import { Award, CheckCircle, XCircle, Clock, HelpCircle, Brain, Target } from "lucide-react"

import { QuizConfetti } from "@/components/ui/quiz-confetti"
const calculatePerformanceLevel = (score: number) => {
  if (score >= 90) return "Excellent"
  if (score >= 80) return "Very Good"
  if (score >= 70) return "Good"
  if (score >= 60) return "Satisfactory"
  if (score >= 50) return "Needs Improvement"
  return "Study Required"
}

interface QuizResultsSummaryProps {
  score: number
  correctAnswers: number
  totalQuestions: number
  totalTimeSpent: number
  formattedTimeSpent: string
  averageSimilarity?: number
  hintsUsed?: number
  quizType?: "mcq" | "blanks" | "code" | "openended" | "flashcard"
}

export function QuizResultsSummary({
  score,
  correctAnswers,
  totalQuestions,
  totalTimeSpent,
  formattedTimeSpent,
  averageSimilarity,
  hintsUsed = 0,
  quizType = "mcq",
}: QuizResultsSummaryProps) {
  const performanceLevel = calculatePerformanceLevel(score)

  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    if (score >= 50) return "text-orange-500"
    return "text-red-600"
  }

  // Determine icon based on quiz type
  const getQuizTypeIcon = () => {
    switch (quizType) {
      case "mcq":
        return <Target className="h-8 w-8 text-purple-600 mb-2" />
      case "blanks":
        return <Brain className="h-8 w-8 text-blue-600 mb-2" />
      case "code":
        return (
          <div className="h-8 w-8 text-cyan-600 mb-2 font-mono text-2xl flex items-center justify-center">{`{ }`}</div>
        )
      case "openended":
        return <div className="h-8 w-8 text-teal-600 mb-2 font-serif text-2xl flex items-center justify-center">Aa</div>
      case "flashcard":
        return <div className="h-8 w-8 text-amber-600 mb-2 flex items-center justify-center">🔄</div>
      default:
        return <Award className="h-8 w-8 text-primary mb-2" />
    }
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  }

  return (
    <>
      {score >= 80 && <QuizConfetti score={score} />}

      <motion.div
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center p-4 border rounded-lg bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 shadow-sm"
        >
          {getQuizTypeIcon()}
          <p className="text-sm text-muted-foreground">Score</p>
          <p className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}%</p>
          <p className="text-xs text-muted-foreground mt-1">{performanceLevel}</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center p-4 border rounded-lg bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 shadow-sm"
        >
          <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
          <p className="text-sm text-muted-foreground">Correct Answers</p>
          <p className="text-2xl font-bold">
            {correctAnswers}/{totalQuestions}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round((correctAnswers / (totalQuestions || 1)) * 100)}% accuracy
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center p-4 border rounded-lg bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 shadow-sm"
        >
          <XCircle className="h-8 w-8 text-red-600 mb-2" />
          <p className="text-sm text-muted-foreground">Incorrect Answers</p>
          <p className="text-2xl font-bold">
            {totalQuestions - correctAnswers}/{totalQuestions}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(((totalQuestions - correctAnswers) / (totalQuestions || 1)) * 100)}% error rate
          </p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center p-4 border rounded-lg bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 shadow-sm"
        >
          <Clock className="h-8 w-8 text-blue-600 mb-2" />
          <p className="text-sm text-muted-foreground">Time Spent</p>
          <p className="text-2xl font-bold">{formattedTimeSpent}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {Math.round(totalTimeSpent / (totalQuestions || 1))} sec/question
          </p>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mt-8">
        <h3 className="text-lg font-medium mb-3">Performance Overview</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Overall Score</span>
              <span className="text-sm font-medium">{score}%</span>
            </div>
            <Progress value={score} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Accuracy</span>
              <span className="text-sm font-medium">{Math.round((correctAnswers / (totalQuestions || 1)) * 100)}%</span>
            </div>
            <Progress value={Math.round((correctAnswers / (totalQuestions || 1)) * 100)} className="h-2 bg-gray-200" />
          </div>

          {averageSimilarity !== undefined && (
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Average Answer Similarity</span>
                <span className="text-sm font-medium">{averageSimilarity}%</span>
              </div>
              <Progress value={averageSimilarity} className="h-2 bg-gray-200" />
            </div>
          )}

          {hintsUsed > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md mt-4 dark:bg-amber-950 dark:border-amber-900">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Hints Used</p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    You used hints for {hintsUsed} out of {totalQuestions} questions (
                    {Math.round((hintsUsed / (totalQuestions || 1)) * 100)}%)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}
