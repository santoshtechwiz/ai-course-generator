"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getBestSimilarityScore } from "@/lib/utils/text-similarity"
import { Confetti } from "@/components/ui/confetti"
import { Button } from "@/components/ui/button"
import { 
  Card,
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { CheckCircleIcon, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"

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

// Move function outside component to prevent recreation
function getSimilarity(userAnswer: string, correctAnswer: string) {
  return getBestSimilarityScore(userAnswer || "", correctAnswer || "") / 100
}

// Move function outside component to prevent recreation
function getSimilarityLabel(similarity: number) {
  if (similarity >= 0.7) return "Correct"
  if (similarity >= 0.5) return "Close"
  return "Incorrect"
}

export default function OpenEndedQuizResults({ result, onRetake, isAuthenticated = true, slug }: Props) {
  const router = useRouter()
  const [showConfetti, setShowConfetti] = useState(false)
  const hasShownConfettiRef = useRef(false)

  // Memoize enhanced results to prevent recalculation on every render
  const enhancedResults = useMemo(() => {
    if (!result?.questionResults) return []

    return result.questionResults.map((q) => {
      // Find the actual user answer from the answers array
      const actualAnswer = result.answers?.find((a) => a.questionId.toString() === q.questionId.toString())
      // Find the question text from the questions array
      const questionData = result.questions?.find((quest) => quest.id.toString() === q.questionId.toString())

      const userAnswer = actualAnswer?.userAnswer || q.userAnswer || ""
      const correctAnswer = q.correctAnswer || questionData?.answer || ""
      
      // Only calculate similarity if not already provided
      const sim = typeof q.similarity === "number" ? q.similarity : getSimilarity(userAnswer, correctAnswer)
      const similarityLabel = getSimilarityLabel(sim)

      return {
        ...q,
        question: q.question || questionData?.question || `Question ${q.questionId}`,
        userAnswer,
        correctAnswer,
        similarity: sim,
        similarityLabel,
        isCorrect: actualAnswer?.isCorrect ?? sim >= 0.7,
      }
    })
  }, [result])

  // Memoize derived values to avoid recalculation
  const { correctCount, totalQuestions, percentage } = useMemo(() => {
    const correct = enhancedResults.filter((q) => q.isCorrect).length
    const total = enhancedResults.length || 1
    const pct = result?.percentage ?? Math.round((correct / total) * 100)
    
    return {
      correctCount: correct,
      totalQuestions: total,
      percentage: pct
    }
  }, [enhancedResults, result?.percentage])

  useEffect(() => {
    const resultId = result?.completedAt
    if (result && resultId && !hasShownConfettiRef.current && percentage >= 70) {
      hasShownConfettiRef.current = true
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [result, percentage])

  // Memoize this function to prevent recreation on every render
  const getScoreClass = useCallback(() => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-amber-600"
    return "text-red-600"
  }, [percentage])

  const handleRetake = useCallback(() => {
    onRetake?.() || router.push(`/dashboard/openended/${slug}`)
  }, [onRetake, router, slug])

  const handleAllQuizzes = useCallback(() => {
    router.push("/dashboard/quizzes")
  }, [router])

  // Early return with memoized check
  if (!result || !Array.isArray(result.questionResults)) {
    return (
      <Card className="max-w-4xl mx-auto rounded-2xl shadow-lg">
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-4" />
          <CardTitle className="text-xl font-bold mb-2">No Results Found</CardTitle>
          <p className="text-muted-foreground">Try retaking the quiz to generate results.</p>
        </CardContent>
      </Card>
    )
  }

  // Memoize card variants to avoid recreation
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeInOut" } },
  }

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <motion.div 
          className="mb-8 rounded-2xl shadow-lg overflow-hidden"
          variants={cardVariants} 
          initial="hidden" 
          animate="visible"
        >
          <Card>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-3xl font-bold mb-2">{result.title || "Quiz Results"}</CardTitle>
              <p className="text-muted-foreground mt-1">
                Completed {new Date(result.completedAt || new Date()).toLocaleDateString()}
              </p>
            </CardHeader>

            <CardContent className="pt-4">
              <div className="flex flex-col items-center justify-center py-6">
                <div className={`text-6xl font-extrabold mb-3 ${getScoreClass()}`}>{percentage}%</div>
                <p className="text-lg text-gray-600 mb-4">
                  {correctCount} correct out of {enhancedResults.length} questions
                </p>

                {percentage >= 70 ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircleIcon className="h-6 w-6" />
                    <span className="text-lg font-semibold">Excellent work!</span>
                  </div>
                ) : percentage >= 50 ? (
                  <div className="text-amber-600 font-semibold">You're close! Keep practicing.</div>
                ) : (
                  <div className="text-red-600 font-semibold">Keep going! You'll get there with more effort.</div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex justify-center gap-4 pt-2 pb-6">
              <Button onClick={handleRetake} variant="outline">
                Retake Quiz
              </Button>
              <Button onClick={handleAllQuizzes}>All Quizzes</Button>
            </CardFooter>
          </Card>
        </motion.div>

        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Question Breakdown</h2>
          {enhancedResults.map((q, idx) => (
            <motion.div
              key={q.questionId}
              className="rounded-xl shadow-md overflow-hidden"
              style={{ backgroundColor: "#f9f9f9" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * idx }} // Use idx instead of array method to improve performance
            >
              <div className="px-6 py-4">
                <div className="font-semibold text-lg mb-3">{q.question}</div>

                <div className="mb-2">
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
                    <span className="ml-2 text-sm font-semibold text-yellow-700">(Close enough!)</span>
                  )}
                </div>

                <div>
                  <span className="font-medium">Correct answer:</span> {q.correctAnswer}
                </div>

                <div className="text-sm text-gray-500 mt-2">
                  Similarity: {Math.round((q.similarity || 0) * 100)}% ({q.similarityLabel})
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {showConfetti && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.2 }}
        >
          <Confetti isActive />
        </motion.div>
      )}
    </>
  )
}
