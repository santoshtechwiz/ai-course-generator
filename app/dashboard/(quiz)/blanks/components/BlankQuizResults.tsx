"use client"


import QuizResults from "../../components/TextQuizResults"
import type { BlanksQuizResult } from "./types"
import { getBestSimilarityScore } from "@/lib/utils/text-similarity"

function getSimilarity(userAnswer: string, correctAnswer: string) {
  return getBestSimilarityScore(userAnswer || "", correctAnswer || "") / 100
}

function getSimilarityLabel(similarity: number) {
  if (similarity >= 0.7) return "Correct"
  if (similarity >= 0.5) return "Close"
  return "Incorrect"
}

interface BlankQuizResultsProps {
  result?: BlanksQuizResult
  onRetake?: () => void
  isAuthenticated: boolean
  slug: string
}

export default function BlankQuizResults({ result, onRetake, isAuthenticated, slug }: BlankQuizResultsProps) {
  // Enhance questionResults with similarity and label
  const enhancedResults = result?.questionResults?.map(q => {
    const sim = getSimilarity(q.userAnswer || "", q.correctAnswer || "")
    return {
      ...q,
      similarity: sim,
      similarityLabel: getSimilarityLabel(sim)
    }
  })

  return (
    <QuizResults
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
      quizType="blanks"
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
