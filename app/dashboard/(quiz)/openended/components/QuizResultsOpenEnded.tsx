"use client"

import TextQuizResults from "../../components/TextQuizResults"
import { getBestSimilarityScore } from "@/lib/utils/text-similarity"

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
    keywords?: string[]
  }>
  questions?: Array<{
    questionId: string | number
    userAnswer?: string
    correctAnswer?: string
    isCorrect?: boolean
    similarity?: number
    question?: string
    keywords?: string[]
  }>
}

interface OpenEndedQuizResultsProps {
  result?: OpenEndedQuizResult
  onRetake?: () => void
  isAuthenticated: boolean
  slug: string
}

function getSimilarity(userAnswer: string, correctAnswer: string, keywords?: string[]) {
  return getBestSimilarityScore(userAnswer || "", correctAnswer || "") / 100
}

function getSimilarityLabel(similarity: number) {
  if (similarity >= 0.7) return "Correct"
  if (similarity >= 0.5) return "Close"
  return "Incorrect"
}

export default function OpenEndedQuizResults({ result, onRetake, isAuthenticated, slug }: OpenEndedQuizResultsProps) {
  // Enhance questionResults with similarity and label
  const enhancedResults = result?.questionResults?.map(q => {
    const sim = typeof q.similarity === "number"
      ? q.similarity
      : getSimilarity(q.userAnswer || "", q.correctAnswer || "", q.keywords)
    return {
      ...q,
      similarity: sim,
      similarityLabel: getSimilarityLabel(sim)
    }
  })

  return (
    <TextQuizResults
      result={
        result
          ? {
              ...result,
              questionResults: enhancedResults,
              completedAt:
                result.completedAt instanceof Date
                  ? result.completedAt.toISOString()
                  : result.completedAt,
            }
          : undefined
      }
      onRetake={onRetake}
      isAuthenticated={isAuthenticated}
      slug={slug}
      quizType="openended"
      // @ts-ignore
      renderQuestionResult={(q) => (
        <div className="mb-4 p-3 rounded border" key={q.questionId}>
          <div className="font-semibold mb-1">{q.question}</div>
          <div>
            <span className="font-medium">Your answer:</span>{" "}
            <span
              className={
                q.similarityLabel === "Correct"
                  ? "text-green-700"
                  : q.similarityLabel === "Close"
                  ? "text-yellow-700"
                  : "text-red-700"
              }
            >
              {q.userAnswer}
            </span>
            {q.similarityLabel === "Close" && (
              <span className="ml-2 text-xs text-yellow-700 font-semibold">(Close enough!)</span>
            )}
          </div>
          <div>
            <span className="font-medium">Correct answer:</span> {q.correctAnswer}
          </div>
          <div className="text-xs text-muted-foreground">
            Similarity: {(q.similarity * 100).toFixed(0)}% ({q.similarityLabel})
          </div>
        </div>
      )}
    />
  )
}
