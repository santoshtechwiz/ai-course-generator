"use client"
import { motion } from "framer-motion"
import { CheckCircle2, XCircle, Clock, Lightbulb, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface ProcessedAnswer {
  questionId: string
  question: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  timeSpent?: number
  explanation?: string
  difficulty?: string
  category?: string
}

interface QuestionCardProps {
  question: ProcessedAnswer
  index: number
}

export function QuestionCard({ question, index }: QuestionCardProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
      <Card
        className={`border-l-4 transition-all duration-200 hover:shadow-md ${
          question.isCorrect
            ? "border-l-green-500 bg-green-50/30 dark:bg-green-950/10"
            : "border-l-red-500 bg-red-50/30 dark:bg-red-950/10"
        }`}
      >
        <CardContent className="p-6">
          {/* Question Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                  question.isCorrect
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                }`}
              >
                {index + 1}
              </div>
              <div className="flex items-center gap-2">
                {question.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                )}
                <Badge variant={question.isCorrect ? "default" : "destructive"} className="text-xs">
                  {question.isCorrect ? "Correct" : "Incorrect"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {question.difficulty && (
                <Badge variant="outline" className={`text-xs ${getDifficultyColor(question.difficulty)}`}>
                  {question.difficulty}
                </Badge>
              )}
              {question.timeSpent && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(question.timeSpent)}
                </Badge>
              )}
            </div>
          </div>

          {/* Question Text */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-2 leading-relaxed">{question.question}</h3>
            {question.category && (
              <Badge variant="secondary" className="text-xs">
                {question.category}
              </Badge>
            )}
          </div>

          {/* Answer Section */}
          <div className="space-y-4">
            {/* User Answer */}
            <div
              className={`p-4 rounded-lg border-2 ${
                question.isCorrect
                  ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                  : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {question.isCorrect ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
                <span className="text-sm font-semibold text-foreground">Your Answer:</span>
              </div>
              <p
                className={`text-sm font-medium ${
                  question.isCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"
                }`}
              >
                {question.userAnswer}
              </p>
            </div>

            {/* Correct Answer (only show if user was wrong) */}
            {!question.isCorrect && (
              <div className="p-4 rounded-lg border-2 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-semibold text-foreground">Correct Answer:</span>
                </div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">{question.correctAnswer}</p>
              </div>
            )}

            {/* Explanation */}
            {question.explanation && (
              <>
                <Separator className="my-4" />
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-foreground">Explanation:</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">{question.explanation}</p>
                </div>
              </>
            )}
          </div>

          {/* Study Tip for Incorrect Answers */}
          {!question.isCorrect && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Study Tip:</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Review this concept and try similar questions to strengthen your understanding.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
