"use client"


import QuizResults from "../../components/TextQuizResults"
import type { BlanksQuizResult } from "./types"

interface BlankQuizResultsProps {
  result?: BlanksQuizResult
  onRetake?: () => void
  isAuthenticated: boolean
  slug: string
}

export default function BlankQuizResults({ result, onRetake, isAuthenticated, slug }: BlankQuizResultsProps) {
  return (
    <QuizResults
      result={result ? { ...result, completedAt: result.completedAt instanceof Date ? result.completedAt.toISOString() : result.completedAt } : undefined}
      onRetake={onRetake}
      isAuthenticated={isAuthenticated}
      slug={slug}
      quizType="blanks"
    />
  )
}
