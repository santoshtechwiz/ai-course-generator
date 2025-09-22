"use client"
import { motion } from "framer-motion"
import { CheckCircle2, XCircle, Clock, Lightbulb, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import SyntaxHighlighter from "react-syntax-highlighter"
import vs from "react-syntax-highlighter/dist/styles/vs"

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
  codeSnippet?: string
  language?: string
}

interface QuestionCardProps {
  question: ProcessedAnswer
  index: number
}

export function QuestionCard({ question, index }: QuestionCardProps) {
  const formatTime = (seconds: number) => {
    if (!seconds || seconds < 0) return "0.00s"
    if (seconds < 60) {
      return `${seconds.toFixed(2)}s`
    }
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toFixed(2).padStart(5, "0")}` // mm:SS.ss
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
            ? "border-l-green-500 bg-card"
            : "border-l-red-500 bg-card"
        }`}
      >
        <CardContent className="p-6">
          {/* Question Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                  question.isCorrect
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {index + 1}
              </div>
              <div className="flex items-center gap-2">
                {question.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
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
              {typeof question.timeSpent === 'number' && (
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

          {/* Code Snippet (if applicable) */}
          {question.codeSnippet && (
            <div className="mb-4 rounded-lg overflow-hidden border border-border bg-muted/30">
              <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground bg-muted">
                <div>Code</div>
                <div className="font-mono opacity-80">{question.language || 'javascript'}</div>
              </div>
              <div className="max-h-96 overflow-auto">
                <SyntaxHighlighter
                  language={(question.language || 'javascript').toLowerCase()}
                  style={vs}
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    background: 'transparent',
                    fontSize: '0.85rem',
                  }}
                  wrapLongLines
                >
                  {question.codeSnippet}
                </SyntaxHighlighter>
              </div>
            </div>
          )}

          {/* Answer Section */}
          <div className="space-y-4">
            {/* User Answer */}
            <div
              className={`p-4 rounded-lg border ${
                question.isCorrect
                  ? "bg-emerald-500/10 border-emerald-300/50"
                  : "bg-destructive/10 border-destructive/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {question.isCorrect ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
                <span className="text-sm font-semibold text-foreground">Your Answer:</span>
              </div>
              <p
                className={`text-sm font-medium ${
                  question.isCorrect ? "text-emerald-700 dark:text-emerald-300" : "text-destructive"
                }`}
              >
                {question.userAnswer}
              </p>
            </div>

            {/* Correct Answer (only show if user was wrong) */}
            {!question.isCorrect && (
              <div className="p-4 rounded-lg border bg-emerald-500/10 border-emerald-300/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-semibold text-foreground">Correct Answer:</span>
                </div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{question.correctAnswer}</p>
              </div>
            )}

          {/* Explanation */}
          {question.explanation && (
            <>
              <Separator className="my-4" />
              <div className="p-4 rounded-lg bg-muted border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Explanation:</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{question.explanation}</p>
              </div>
            </>
          )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}