"use client"

import { Button } from "@/components/ui/button"

import { useCallback } from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useAppSelector } from "@/store"
import { useQuiz } from "@/hooks/useQuizState"
import CodeQuizResult from "../../components/CodeQuizResult"
import type { CodeQuizResultData } from "@/app/types/code-quiz-types"
import { LoadingDisplay, ErrorDisplay } from "../../../components/QuizStateDisplay"

export default function CodeQuizResultsPage() {
  const router = useRouter()
  const { slug } = useParams() as { slug: string }

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resultData, setResultData] = useState<CodeQuizResultData | null>(null)
  const [isLoadingResults, setIsLoadingResults] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated" && !!session?.user

  const quizState = useAppSelector((state) => state.quiz)
  const { userAnswers } = quizState

  const { getResults, requireAuthentication, submitQuiz } = useQuiz()

  // Generate local results for unauthenticated users
  const generateLocalResults = useCallback(() => {
    if (!userAnswers || userAnswers.length === 0) {
      return null
    }

    // Calculate score based on local answers
    const totalQuestions = userAnswers.length
    const correctAnswers = userAnswers.filter((answer) => answer.isCorrect).length
    const score = Math.round((correctAnswers / totalQuestions) * 100)

    // Calculate total time spent
    const totalTimeSpent = userAnswers.reduce((total, answer) => total + (answer.timeSpent || 0), 0)

    return {
      slug,
      title: "Code Quiz",
      score,
      totalQuestions,
      correctAnswers,
      totalTimeSpent,
      formattedTimeSpent: formatTime(totalTimeSpent),
      completedAt: new Date().toISOString(),
      answers: userAnswers.map((answer) => ({
        questionId: answer.questionId,
        question: `Question ${userAnswers.findIndex((a) => a.questionId === answer.questionId) + 1}`,
        userAnswer: typeof answer.answer === "string" ? answer.answer : JSON.stringify(answer.answer),
        correctAnswer: "",
        isCorrect: answer.isCorrect || false,
      })),
    }
  }, [userAnswers, slug])

  // Format time helper
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Load results when authenticated
  const loadResults = async () => {
    setIsLoadingResults(true)
    try {
      if (isAuthenticated) {
        // For authenticated users, try to get results from API
        try {
          console.log(`Fetching results for slug: ${slug}, attempt: ${retryCount + 1}`)
          const result = await getResults(slug)

          if (result) {
            console.log("Results fetched successfully:", result)
            setResultData(result)
            setError(null)
          } else {
            console.error("No results returned from API")

            // Try to submit the quiz if we have answers but no results
            if (userAnswers && userAnswers.length > 0) {
              try {
                await submitQuiz()
                const newResult = await getResults(slug)
                if (newResult) {
                  setResultData(newResult)
                  setError(null)
                } else {
                  setError("Could not load quiz results. Please try again.")
                }
              } catch (err) {
                console.error("Error submitting quiz:", err)
                setError("Failed to submit quiz results. Please try again.")
              }
            } else {
              setError("Could not load quiz results. Please try again.")
            }
          }
        } catch (err) {
          console.error("Error fetching results:", err)
          setError("Failed to load quiz results. Please try again.")
        }
      } else {
        // For unauthenticated users, generate local results
        const localResults = generateLocalResults()
        if (localResults) {
          setResultData(localResults)
          setError(null)
        } else {
          setError("No quiz data available. Please take the quiz first.")
        }
      }
    } catch (err) {
      console.error("Unexpected error in loadResults:", err)
      setError("An unexpected error occurred while loading results.")
    } finally {
      setIsLoadingResults(false)
      setIsLoading(false)
    }
  }

  // Handle authentication state changes
  useEffect(() => {
    if (status === "loading") return

    loadResults()
  }, [status, retryCount])

  // Handle sign-in action
  const handleSignIn = () => {
    requireAuthentication(`/dashboard/code/${slug}/results`)
  }

  const handleRetry = () => {
    setError(null)
    setIsLoading(true)
    setRetryCount((prev) => prev + 1)
  }

  const handleReturn = () => {
    router.push(`/dashboard/code/${slug}`)
  }

  // === UI STATES ===
  if (status === "loading" || isLoadingResults) {
    return <LoadingDisplay message="Loading your quiz results..." />
  }

  if (isLoading) {
    return <LoadingDisplay message="Preparing your results..." />
  }

  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRetry} onReturn={handleReturn} />
  }

  if (!resultData) {
    // If no results but we have answers, show them anyway
    const localResults = generateLocalResults()
    if (localResults) {
      return <CodeQuizResult result={localResults} />
    }

    return (
      <ErrorDisplay
        error="Could not load quiz results. The quiz may not have been completed."
        onRetry={handleRetry}
        onReturn={handleReturn}
      />
    )
  }

  // For unauthenticated users, show sign-in prompt with results
  if (!isAuthenticated) {
    return (
      <>
        <CodeQuizResult result={resultData} />
        <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-lg max-w-3xl mx-auto">
          <h3 className="text-lg font-medium mb-2">Sign in to save your results</h3>
          <p className="text-muted-foreground mb-4">
            Your results are currently only stored locally. Sign in to save them to your account.
          </p>
          <Button onClick={handleSignIn} variant="default">
            Sign In to Save Results
          </Button>
        </div>
      </>
    )
  }

  return <CodeQuizResult result={resultData} />
}
