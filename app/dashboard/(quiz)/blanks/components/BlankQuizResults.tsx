"use client"


import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { getBestSimilarityScore } from "@/lib/utils/text-similarity"
import { Confetti } from "@/components/ui/confetti"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircleIcon, X, AlertTriangle } from "lucide-react"
import type { BlanksQuizResult } from "./types"

// Helper functions that don't rely on auth state
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
  isAuthenticated?: boolean
  slug: string
}

export default function BlankQuizResults({ result, onRetake, isAuthenticated, slug }: BlankQuizResultsProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const router = useRouter()

  // Show confetti on successful completion with good score
  useEffect(() => {
    if (result && result.percentage >= 70) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [result])

  // If no result, return null to prevent rendering errors
  if (!result) return null

  // Ensure questionResults exists and has data
  if (!result.questionResults || !Array.isArray(result.questionResults)) {
    console.error("Invalid question results:", result)
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <CardTitle className="text-xl font-bold mb-2">Invalid Results</CardTitle>
            <p className="text-muted-foreground">No valid question results found.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Process and enhance the results with similarity scores
  const enhancedResults = result.questionResults.map(q => {
    const userAnswer = q.userAnswer || ""
    const correctAnswer = q.correctAnswer || ""
    const sim = getSimilarity(userAnswer, correctAnswer)

    return {
      ...q,
      similarity: q.similarity ?? sim, // Use existing similarity if available
      similarityLabel: q.similarityLabel || getSimilarityLabel(sim),
      isCorrect: q.isCorrect ?? (sim >= 0.7), // Use existing isCorrect if available
    }
  })

  // Count correct answers
  const correctCount = enhancedResults.filter(q => q.isCorrect || q.similarityLabel === "Correct").length
  
  // Calculate percentage if not already provided
  const percentage = result.percentage ?? Math.round((correctCount / enhancedResults.length) * 100)
  
  // Determine result class based on score
  const getScoreClass = () => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-amber-600"
    return "text-red-600"
  }

  // View all questions or return to quizzes
  const handleViewAllQuizzes = () => {
    router.push("/dashboard/quizzes")
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold">{result.title || "Quiz Results"}</CardTitle>
            <p className="text-muted-foreground mt-1">
              Completed {new Date(result.completedAt).toLocaleDateString()}
            </p>
          </CardHeader>
          
          <CardContent className="pt-4">
            {/* Score Summary */}
            <div className="flex flex-col items-center justify-center py-6">
              <div className={`text-5xl font-bold mb-2 ${getScoreClass()}`}>
                {percentage}%
              </div>
              <p className="text-lg mb-3">
                {correctCount} correct out of {enhancedResults.length} questions
              </p>
              
              {percentage >= 70 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Great job! You've mastered this quiz.</span>
                </div>
              ) : percentage >= 50 ? (
                <div className="text-amber-600">
                  Almost there! Keep practicing.
                </div>
              ) : (
                <div className="text-red-600">
                  Keep studying and try again soon!
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-center gap-4 pt-2 pb-6">
            <Button onClick={onRetake} variant="outline">
              Retake Quiz
            </Button>
            <Button onClick={handleViewAllQuizzes}>
              All Quizzes
            </Button>
          </CardFooter>
        </Card>

        {/* Question Results */}
        <div className="space-y-6 mb-8">
          <h2 className="text-xl font-semibold">Question Results</h2>
          
          {enhancedResults.map((q) => (
            <div className="mb-4 p-4 rounded-lg border" key={q.questionId}>
              <div className="font-semibold mb-2">{q.question}</div>
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
                  {q.userAnswer || "(no answer)"}
                </span>
                {q.similarityLabel === "Close" && (
                  <span className="ml-2 text-xs text-yellow-700 font-semibold">(Close enough!)</span>
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
      <Confetti isActive={showConfetti} />
    </>
  )
}
