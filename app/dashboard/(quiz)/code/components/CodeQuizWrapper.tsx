"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

import { useQuiz } from "@/hooks/useQuizState"
import { InitializingDisplay, EmptyQuestionsDisplay, ErrorDisplay } from "../../components/QuizStateDisplay"
import CodingQuiz from "./CodingQuiz"

interface CodeQuizWrapperProps {
  slug: string
  quizId: string
  userId: string | null
  quizData?: any
}

export default function CodeQuizWrapper({ slug, quizId, userId, quizData: initialQuizData }: CodeQuizWrapperProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [authChecked, setAuthChecked] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Get quiz state from Redux
  const {
    quizData,
    currentQuestion,
    isCompleted,
    error,
    isLoading,
    loadQuiz,
    saveAnswer,
    submitQuiz,
    nextQuestion,
    resetQuizState,
  } = useQuiz()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      // Store the current URL to redirect back after login
      sessionStorage.setItem("quizRedirectPath", window.location.pathname)
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
    } else if (status === "authenticated") {
      setAuthChecked(true)
    }
  }, [status, router])

  // Load quiz data if not provided
  useEffect(() => {
    if (authChecked && !quizData && !isLoading && !error) {
      loadQuiz(slug, "code").catch((err) => {
        console.error("Error loading quiz:", err)
        setErrorMessage("Failed to load quiz")
      })
    }
  }, [authChecked, quizData, slug, loadQuiz, isLoading, error])

  // Use initial quiz data if provided
  useEffect(() => {
    if (initialQuizData && !quizData && !isLoading) {
      // This would typically happen in a Redux action, but we can simulate it here
      loadQuiz(slug, "code", initialQuizData)
    }
  }, [initialQuizData, quizData, isLoading, loadQuiz, slug])

  // Clean up on unmount or when navigating away
  useEffect(() => {
    return () => {
      // Only reset if navigating away from the quiz page
      if (!window.location.pathname.includes(`/dashboard/code/${slug}`)) {
        resetQuizState()
      }
    }
  }, [resetQuizState, slug])

  // Handle answer submission
  const handleAnswer = useCallback(
    async (answer: string, elapsedTime: number, isCorrect: boolean) => {
      try {
        if (!quizData || currentQuestion === undefined) return

        const currentQuestionData = quizData.questions[currentQuestion]

        // Save the answer to Redux store
        await saveAnswer(currentQuestionData.id, answer)

        // Check if this is the last question
        const isLastQuestion = currentQuestion === quizData.questions.length - 1

        if (isLastQuestion) {
          // Submit the entire quiz if this is the last question
          await submitQuiz(slug)
          // Redirect to results page
          router.replace(`/dashboard/code/${slug}/results`)
        } else {
          // Move to the next question
          nextQuestion()
        }
      } catch (err) {
        console.error("Error handling answer:", err)
        setErrorMessage("Failed to submit answer")
      }
    },
    [quizData, currentQuestion, saveAnswer, submitQuiz, router, slug, nextQuestion],
  )

  // Handle returning to quizzes page
  const handleReturn = useCallback(() => {
    router.push("/dashboard/quizzes")
  }, [router])

  // Handle retry loading
  const handleRetry = useCallback(() => {
    window.location.reload()
  }, [])

  // If not authenticated, show error message
  if (status === "unauthenticated") {
    return (
      <ErrorDisplay
        error="Please sign in to access this quiz"
        onRetry={() => router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`)}
        onReturn={handleReturn}
      />
    )
  }

  // Show loading state
  if (isLoading || status === "loading" || !authChecked) {
    return <InitializingDisplay />
  }

  // Show error state
  if (error || errorMessage) {
    return (
      <ErrorDisplay
        error={error || errorMessage || "An error occurred"}
        onRetry={handleRetry}
        onReturn={handleReturn}
      />
    )
  }

  // If we have quiz data but no questions, show empty state
  if (quizData && (!quizData.questions || quizData.questions.length === 0)) {
    return <EmptyQuestionsDisplay onReturn={handleReturn} />
  }

  // If we have quiz data and questions, render the quiz
  if (quizData && quizData.questions && quizData.questions.length > 0) {
    const currentQuestionData = quizData.questions[currentQuestion]
    const totalQuestions = quizData.questions.length
    const isLastQuestion = currentQuestion === totalQuestions - 1

    return (
      <CodingQuiz
        question={currentQuestionData}
        onAnswer={handleAnswer}
        questionNumber={currentQuestion + 1}
        totalQuestions={totalQuestions}
        isLastQuestion={isLastQuestion}
      />
    )
  }

  // If we get here, we're still loading or initializing
  return <InitializingDisplay />
}
