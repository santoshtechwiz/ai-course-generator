"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useSelector } from "react-redux"
import {
  selectQuizResults,
  selectQuestions,
  selectQuizTitle,
} from "@/store/slices/quizSlice"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface BlanksQuizResult {
  score?: number
  maxScore?: number
  percentage?: number
  completedAt: string
  correctAnswers?: number
  totalQuestions?: number
  answers?: Record<string, any> | any[]
  questionResults?: any[]
}

interface BlankQuizResultsProps {
  result?: BlanksQuizResult
  onRetake?: () => void
}

const getUserAnswer = (answer: any): string => {
  if (!answer) return "No answer"

  if (answer.filledBlanks && typeof answer.filledBlanks === "object") {
    return Object.values(answer.filledBlanks).filter(Boolean).join(", ") || "No answer"
  }

  if (typeof answer.userAnswer === "object") {
    return Object.values(answer.userAnswer).filter(Boolean).join(", ") || "No answer"
  }

  if (typeof answer.userAnswer === "string") return answer.userAnswer
  if (typeof answer.answer === "string") return answer.answer
  if (typeof answer.text === "string") return answer.text

  return "No answer"
}

const getCorrectAnswer = (answer: any, question: any): string => {
  return (
    answer?.correctAnswer ||
    question?.answer ||
    answer?.modelAnswer ||
    question?.modelAnswer ||
    "Unknown"
  )
}

const getScoreColor = (percentage: number) => {
  if (percentage >= 90) return "text-green-600"
  if (percentage >= 70) return "text-blue-600"
  if (percentage >= 50) return "text-yellow-600"
  return "text-red-600"
}

const getFeedback = (percentage: number) => {
  if (percentage >= 90) return "Excellent! You've mastered this topic."
  if (percentage >= 70) return "Great job! You have a good understanding of the material."
  if (percentage >= 50) return "Good effort! You're on the right track."
  return "Keep practicing! Review the material and try again."
}

export function BlankQuizResults({ result, onRetake }: BlankQuizResultsProps) {
  const [showAnswers, setShowAnswers] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const storeResults = useSelector(selectQuizResults)
  const questions = useSelector(selectQuestions)
  const title = useSelector(selectQuizTitle)

  const quizResult = result || storeResults

  // Add loading effect
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  // Memoize answer mapping to prevent unnecessary recalculations
  const answerMap = useMemo(() => {
    const map: Record<number, any> = {}

    if (quizResult?.answers && typeof quizResult.answers === "object") {
      Object.entries(quizResult.answers).forEach(([key, val]) => {
        const numKey = parseInt(key)
        if (!isNaN(numKey)) {
          map[numKey] = val
        }
      })
    }

    if (Array.isArray(quizResult?.questionResults)) {
      quizResult.questionResults.forEach((res) => {
        if (res && res.questionId !== undefined) {
          map[res.questionId] = res
        }
      })
    }

    return map
  }, [quizResult])

  // Memoize score calculations
  const { score, maxScore, percentage } = useMemo(() => {
    const calculatedScore = quizResult?.score ?? quizResult?.correctAnswers ?? 0
    const calculatedMaxScore = quizResult?.maxScore ?? quizResult?.totalQuestions ?? (questions?.length || 0)
    const calculatedPercentage = quizResult?.percentage ?? 
      (calculatedMaxScore > 0 ? Math.round((calculatedScore / calculatedMaxScore) * 100) : 0)
    
    return {
      score: Math.max(0, calculatedScore),
      maxScore: Math.max(1, calculatedMaxScore),
      percentage: Math.min(100, Math.max(0, calculatedPercentage))
    }
  }, [quizResult, questions])

  // Memoize toggle function to prevent unnecessary re-renders
  const toggleAnswers = useCallback(() => {
    setShowAnswers(prev => !prev)
  }, [])

  // Clean up state on unmount
  useEffect(() => {
    return () => {
      setShowAnswers(false)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-pulse text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    )
  }

  if (!quizResult && (!questions || questions.length === 0)) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-bold mb-2">No Results Available</h2>
        <p className="text-gray-600 mb-4">We couldn't find your quiz results.</p>
        {onRetake && (
          <Button onClick={onRetake} variant="outline">
            Try Again
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">{title} - Quiz Completed!</h1>
        <p className="text-muted-foreground">
          Completed on{" "}
          {quizResult.completedAt
            ? new Date(quizResult.completedAt).toLocaleDateString()
            : "Unknown"}
        </p>
      </div>

      <Card className="bg-card shadow-md">
        <CardHeader className="text-center pb-2">
          <CardTitle>Your Score</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-4xl font-bold mb-2">
            <span className={getScoreColor(percentage)}>{score}</span>
            <span className="text-muted-foreground mx-2">/</span>
            <span>{maxScore}</span>
          </div>
          <div className="text-xl font-medium mb-4">
            <span className={getScoreColor(percentage)}>{percentage}%</span>
          </div>
          <p className="text-muted-foreground">{getFeedback(percentage)}</p>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button onClick={toggleAnswers} variant="outline">
          {showAnswers ? "Hide Answers" : "Show Answers"}
        </Button>
      </div>

      {showAnswers && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Question Details</h2>
          {questions.map((question, index) => {
            const answer = answerMap[question.id]
            const userAnswer = getUserAnswer(answer)
            const correctAnswer = getCorrectAnswer(answer, question)
            const isCorrect = answer?.isCorrect

            return (
              <Card
                key={question.id}
                className={`border-l-4 ${
                  isCorrect ? "border-l-green-500" : "border-l-red-500"
                }`}
              >
                <CardContent className="p-4">
                  <p className="font-medium mb-2">Question {index + 1}:</p>
                  <p className="mb-4">{question.question}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Your Answer:</p>
                      <p
                        className={`font-medium ${
                          isCorrect ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {userAnswer}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Correct Answer:</p>
                      <p className="font-medium text-green-600">{correctAnswer}</p>
                    </div>
                  </div>
                  {answer?.modelAnswer &&
                    answer.modelAnswer !== correctAnswer && (
                      <div className="mt-2">
                        <p className="text-sm text-muted-foreground">Model Answer:</p>
                        <p className="font-medium text-blue-600">
                          {answer.modelAnswer}
                        </p>
                      </div>
                    )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {onRetake && (
        <div className="text-center mt-8">
          <Button onClick={onRetake}>Retake Quiz</Button>
        </div>
      )}
    </div>
  )
}