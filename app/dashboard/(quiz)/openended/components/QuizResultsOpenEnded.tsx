"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { getBestSimilarityScore } from "@/lib/utils/text-similarity"
import { Confetti } from "@/components/ui/confetti"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircleIcon, AlertTriangle } from "lucide-react"

interface QuestionResult {
  questionId: string | number
  userAnswer?: string
  correctAnswer?: string
  isCorrect?: boolean
  similarity?: number
  question?: string
  keywords?: string[]
  similarityLabel?: string
}

interface OpenEndedQuizResult {
  title?: string
  maxScore?: number
  userScore?: number
  score?: number
  percentage?: number
  completedAt?: string
  questionResults?: QuestionResult[]
}

interface Props {
  result?: OpenEndedQuizResult
  onRetake?: () => void
  isAuthenticated: boolean
  slug: string
}

function getSimilarity(userAnswer: string, correctAnswer: string) {
  return getBestSimilarityScore(userAnswer || "", correctAnswer || "") / 100
}

function getSimilarityLabel(similarity: number) {
  if (similarity >= 0.7) return "Correct"
  if (similarity >= 0.5) return "Close"
  return "Incorrect"
}

export default function OpenEndedQuizResults({ result, onRetake, isAuthenticated = true, slug }: Props) {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(false)
  const hasShownConfettiRef = useRef(false)

  const enhancedResults = useMemo(() => {
    return result?.questionResults?.map((q) => {
      const sim = typeof q.similarity === "number"
        ? q.similarity
        : getSimilarity(q.userAnswer || "", q.correctAnswer || "")
      const similarityLabel = getSimilarityLabel(sim)
      return {
        ...q,
        similarity: sim,
        similarityLabel,
        isCorrect: q.isCorrect ?? (sim >= 0.7),
      }
    }) ?? []
  }, [result])

  const correctCount = enhancedResults.filter(q => q.isCorrect).length
  const percentage = result?.percentage ?? Math.round((correctCount / enhancedResults.length) * 100)

  useEffect(() => {
    const resultId = result?.completedAt
    if (result && resultId && !hasShownConfettiRef.current && percentage >= 70) {
      hasShownConfettiRef.current = true
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [result, percentage])

  const getScoreClass = () => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-amber-600"
    return "text-red-600"
  }

  const handleRetake = () => {
    onRetake?.() || router.push(`/dashboard/openended/${slug}`)
  }

  const handleAllQuizzes = () => {
    router.push("/dashboard/quizzes")
  }

  if (!result || !Array.isArray(result.questionResults)) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-4" />
          <CardTitle className="text-xl font-bold mb-2">No Results Found</CardTitle>
          <p className="text-muted-foreground">Try retaking the quiz to generate results.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">{result.title || "Quiz Results"}</CardTitle>
            <p className="text-muted-foreground mt-1">
              Completed {new Date(result.completedAt || new Date()).toLocaleDateString()}
            </p>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="flex flex-col items-center justify-center py-6">
              <div className={`text-5xl font-bold mb-2 ${getScoreClass()}`}>{percentage}%</div>
              <p className="text-lg mb-3">{correctCount} correct out of {enhancedResults.length} questions</p>

              {percentage >= 70 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Excellent work!</span>
                </div>
              ) : percentage >= 50 ? (
                <div className="text-amber-600">You're close! Keep practicing.</div>
              ) : (
                <div className="text-red-600">Keep going! You'll get there with more effort.</div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-center gap-4 pt-2 pb-6">
            <Button onClick={handleRetake} variant="outline">Retake Quiz</Button>
            <Button onClick={handleAllQuizzes}>All Quizzes</Button>
          </CardFooter>
        </Card>

        <div className="space-y-6 mb-8">
          <h2 className="text-xl font-semibold">Question Breakdown</h2>
          {enhancedResults.map((q) => (
            <div key={q.questionId} className="p-4 mb-4 border rounded-lg">
              <div className="font-semibold mb-2">{q.question}</div>

              <div>
                <span className="font-medium">Your answer:</span>{" "}
                <span className={
                  q.similarityLabel === "Correct"
                    ? "text-green-700"
                    : q.similarityLabel === "Close"
                    ? "text-yellow-700"
                    : "text-red-700"
                }>
                  {q.userAnswer || "(no answer)"}
                </span>
                {q.similarityLabel === "Close" && (
                  <span className="ml-2 text-xs font-semibold text-yellow-700">(Close enough!)</span>
                )}
              </div>

              <div>
                <span className="font-medium">Correct answer:</span> {q.correctAnswer}
              </div>

              <div className="text-xs text-muted-foreground mt-1">
                Similarity: {Math.round((q.similarity || 0) * 100)}% ({q.similarityLabel})
              </div>
            </div>
          ))}
        </div>
      </div>

      {showConfetti && <Confetti isActive />}
    </>
  )
}
