"use client"

import QuizResults from "../../components/TextQuizResults"



interface OpenEndedQuizResult {
  title?: string
  maxScore?: number
  userScore?: number
  score?: number
  percentage?: number
  completedAt?: string
  questionResults?: Array<{
    questionId: string | number
    userAnswer?: string
    correctAnswer?: string
    isCorrect?: boolean
    similarity?: number
    question?: string
  }>
  questions?: Array<{
    questionId: string | number
    userAnswer?: string
    correctAnswer?: string
    isCorrect?: boolean
    similarity?: number
    question?: string
  }>
}

interface OpenEndedQuizResultsProps {
  result?: OpenEndedQuizResult
  onRetake?: () => void
  isAuthenticated: boolean
  slug: string
}

export default function OpenEndedQuizResults({ result, onRetake, isAuthenticated, slug }: OpenEndedQuizResultsProps) {
  return (
    <QuizResults
      result={result}
      onRetake={onRetake}
      isAuthenticated={isAuthenticated}
      slug={slug}
      quizType="openended"
    />
  )
}
