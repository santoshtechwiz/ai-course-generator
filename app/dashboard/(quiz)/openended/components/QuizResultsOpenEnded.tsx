"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { diffChars } from "diff"
import { CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp, RotateCw } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { getPerformanceLevel, QuizResultBase } from "../../components/QuizResultBase"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface QuizResultsProps {
  answers: { answer: string; timeSpent: number; hintsUsed: boolean; similarity?: number }[]
  questions: { id: number; question: string; answer: string }[]
  onRestart: () => void
  onComplete: (score: number) => void
  quizId: string
  title: string
  slug: string
  clearGuestData?: () => void
}

export default function QuizResultsOpenEnded({
  answers,
  questions,
  onRestart,
  onComplete,
  quizId,
  title,
  slug,
  clearGuestData,
}: QuizResultsProps) {
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveCompleted, setSaveCompleted] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  // Add this debugging log at the beginning of the component to see what data we're receiving
  console.log("QuizResultsOpenEnded received:", {
    answersLength: answers?.length,
    answers,
    questionsLength: questions?.length,
    quizId,
    slug,
  })

  // Calculate score and total time
  const { score, results } = useMemo(() => {
    // Add defensive check for empty answers
    if (!answers || answers.length === 0) {
      console.warn("No answers provided to QuizResultsOpenEnded")
      // Create empty results with default values
      const emptyResults = questions.map((question) => ({
        ...question,
        userAnswer: "",
        correctAnswer: question.answer,
        similarity: 0,
        timeSpent: 0,
        isCorrect: false,
      }))
      return { score: 0, results: emptyResults }
    }

    const calculatedResults = questions.map((question, index) => {
      // If we don't have an answer for this question, provide a default
      if (!answers[index]) {
        console.warn(`No answer found for question ${index}`)
        return {
          ...question,
          userAnswer: "",
          correctAnswer: question.answer,
          similarity: 0,
          timeSpent: 0,
          isCorrect: false,
        }
      }

      // Calculate similarity if not already provided
      const userAnswer = answers[index]?.answer?.trim() || ""
      const correctAnswer = question.answer?.trim() || ""
      const similarity =
        answers[index]?.similarity !== undefined
          ? answers[index].similarity!
          : calculateSimilarity(correctAnswer, userAnswer)

      return {
        ...question,
        userAnswer: answers[index]?.answer?.trim() || "",
        correctAnswer: question.answer,
        similarity,
        timeSpent: answers[index]?.timeSpent || 0,
        isCorrect: similarity > 80,
      }
    })

    const totalScore = calculatedResults.reduce((acc, result) => acc + result.similarity, 0)
    const averageScore = Math.min(100, totalScore / Math.max(1, calculatedResults.length))

    return { score: averageScore, results: calculatedResults }
  }, [answers, questions])

  const hasCalledComplete = useRef(false)
  const totalTime = useMemo(() => answers.reduce((sum, answer) => sum + (answer?.timeSpent || 0), 0), [answers])

  useEffect(() => {
    if (!hasCalledComplete.current) {
      hasCalledComplete.current = true
      onComplete(Math.round(score))

      // Log the answers for debugging
      console.log("Displaying quiz results with answers:", answers)
    }

    // If user is not logged in and clearGuestData is provided, call it
    if (!session?.user && clearGuestData) {
      // Don't clear immediately - give user time to see results
      const timer = setTimeout(() => {
        clearGuestData()
      }, 300000) // 5 minutes

      return () => clearTimeout(timer)
    }
  }, [score, onComplete, session, clearGuestData, answers])

  const performance = getPerformanceLevel(score)

  const toggleExpanded = (index: number) => {
    setExpandedQuestions((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  const handleRestart = () => {
    // Clear session storage for this quiz
    if (typeof window !== "undefined") {
      // Clear all storage related to this quiz
      sessionStorage.removeItem(`quiz_result_${quizId}`)
      localStorage.removeItem(`quiz_result_${quizId}`)
      sessionStorage.removeItem(`quiz_state_openended_${quizId}`)
      localStorage.removeItem(`quiz_answers_${quizId}`)

      // Also clear any other related storage
      const storageKey = `quiz_${slug}_openended`
      sessionStorage.removeItem(storageKey)
    }

    // Reset all state before restarting
    hasCalledComplete.current = false
    setSaveCompleted(false)
    setSaveError(null)

    // Call the provided onRestart function
    onRestart()

    // Force a page refresh to ensure all state is reset
    router.refresh()

    // Navigate back to the quiz page
    router.push(`/dashboard/openended/${slug}`)
  }

  return (
    <QuizResultBase
      quizId={quizId}
      title={title}
      score={score}
      totalQuestions={questions.length}
      totalTime={totalTime}
      slug={slug}
      quizType="openended"
      clearGuestData={clearGuestData}
      isSaving={isSaving}
    >
      <div className="max-w-4xl mx-auto p-4">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              Quiz Results
              {isSaving && <span className="text-sm text-muted-foreground">(Saving...)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p className="text-3xl font-bold mb-2">{score.toFixed(1)}%</p>
              <Progress value={score} className="w-full h-2" indicatorClassName={performance.bgColor} />
              <p className="mt-2 text-sm text-muted-foreground">{performance.message}</p>
            </div>

            {/* Debug info - can be removed in production */}
            {answers.length === 0 && (
              <div className="p-4 mb-4 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-amber-800 font-medium">No answers found to display.</p>
                <p className="text-sm text-amber-700">This may happen if you signed out and back in.</p>
              </div>
            )}

            {results.map((result, index) => (
              <Collapsible
                key={result.id || index}
                open={expandedQuestions.includes(index)}
                onOpenChange={() => toggleExpanded(index)}
              >
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex justify-between items-center">
                      <span>Question {index + 1}</span>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center gap-2">
                          {expandedQuestions.includes(index) ? "Hide Details" : "Show Details"}
                          {expandedQuestions.includes(index) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2">{result.question}</div>
                    <div className="flex items-center gap-2 mb-4">
                      {result.similarity === 100 ? (
                        <CheckCircle className="text-green-500" />
                      ) : result.similarity > 80 ? (
                        <AlertTriangle className="text-yellow-500" />
                      ) : (
                        <XCircle className="text-red-500" />
                      )}
                      <span>
                        {result.similarity === 100
                          ? "Perfect match!"
                          : result.similarity > 80
                            ? "Close enough!"
                            : "Needs improvement"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <strong className="min-w-[120px]">Your Answer:</strong>
                        <span>{result.userAnswer || "(No answer provided)"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <strong className="min-w-[120px]">Model Answer:</strong>
                        <span className="font-bold text-green-600 dark:text-green-400">{result.correctAnswer}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <strong className="min-w-[120px]">Accuracy:</strong>
                        <span>{result.similarity.toFixed(1)}%</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Time spent: {Math.floor(result.timeSpent / 60)}m {Math.round(result.timeSpent % 60)}s
                    </p>
                    <CollapsibleContent>
                      <div className="mt-4">
                        <h4 className="font-semibold mb-1">Comparison:</h4>
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded whitespace-pre-wrap">
                          {renderDiff(result.correctAnswer, result.userAnswer)}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </CardContent>
                </Card>
              </Collapsible>
            ))}
            <div className="flex justify-center mt-6">
              <Button onClick={handleRestart} disabled={isSaving}>
                <RotateCw className="mr-2 h-4 w-4" />
                Restart Quiz
              </Button>
            </div>
            {saveError && (
              <p className="text-red-500 text-center mt-4">
                Error saving results: {saveError}. Your progress is still displayed here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </QuizResultBase>
  )
}

function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0

  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  const longerLength = longer.length

  if (longerLength === 0) return 100

  const editDistance = levenshteinDistance(longer, shorter)
  return Math.max(0, Math.min(100, (1 - editDistance / longerLength) * 100))
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]) + 1
      }
    }
  }

  return dp[m][n]
}

function renderDiff(correct: string, user: string) {
  if (!correct || !user) return null

  const diff = diffChars(correct?.toLowerCase(), user?.toLowerCase())
  return diff.map((part, index) => (
    <span
      key={index}
      className={
        part.added
          ? "bg-red-200 dark:bg-red-800"
          : part.removed
            ? "bg-green-200 dark:bg-green-800"
            : "bg-gray-100 dark:bg-gray-700"
      }
    >
      {part.value}
    </span>
  ))
}
