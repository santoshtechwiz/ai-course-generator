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
  isPublic?: boolean
  isFavorite?: boolean
  ownerId?: string
}

export default function CodeQuizWrapper({
  slug,
  quizId,
  userId,
  quizData,
  isPublic,
  isFavorite,
  ownerId,
}: CodeQuizWrapperProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [authChecked, setAuthChecked] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    quizData: quizState,
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

  // Auth check
  useEffect(() => {
    if (status === "unauthenticated") {
      sessionStorage.setItem("quizRedirectPath", window.location.pathname)
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
    } else if (status === "authenticated") {
      setAuthChecked(true)
    }
  }, [status, router])

  // Load quiz only if not already loaded
  useEffect(() => {
    if (authChecked && !quizState && !isLoading && !error) {
      const source = quizData ?? undefined
      loadQuiz(slug, "code", source).catch((err) => {
        console.error("Error loading quiz:", err)
        setErrorMessage("Failed to load quiz")
      })
    }
  }, [authChecked, slug, quizData, quizState, isLoading, error, loadQuiz])

  // Cleanup quiz state on unmount or navigation
  useEffect(() => {
    return () => {
      if (!window.location.pathname.includes(`/dashboard/code/${slug}`)) {
        resetQuizState()
      }
    }
  }, [resetQuizState, slug])

  // Always read from quizState (Redux)
  const effectiveQuizData = quizState
  const questions = effectiveQuizData?.questions || []
  const totalQuestions = questions.length
  const currentQuestionData = questions[currentQuestion] || null
  const isLastQuestion = currentQuestion === totalQuestions - 1

  // Answer handler
  const handleAnswer = useCallback(
    async (answer: string, elapsedTime: number, isCorrect: boolean) => {
      try {
        const question = questions[currentQuestion]

        if (!question || !question.id) {
          setErrorMessage("Invalid question data")
          return
        }

        await saveAnswer(question.id, answer)

        if (isLastQuestion) {
          await submitQuiz(slug)
          router.replace(`/dashboard/code/${slug}/results`)
        } else {
          nextQuestion()
        }
      } catch (err) {
        console.error("Error handling answer:", err)
        setErrorMessage("Failed to submit answer")
      }
    },
    [questions, currentQuestion, saveAnswer, submitQuiz, router, slug, isLastQuestion, nextQuestion],
  )

  const handleReturn = useCallback(() => {
    router.push("/dashboard/quizzes")
  }, [router])

  const handleRetry = useCallback(() => {
    window.location.reload()
  }, [])

  // Handle auth state
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
        error={errorMessage || error || "An error occurred"}
        onRetry={handleRetry}
        onReturn={handleReturn}
      />
    )
  }

  // Empty quiz
  if (!questions.length) {
    return <EmptyQuestionsDisplay onReturn={handleReturn} />
  }

  // Show quiz
  if (currentQuestionData) {
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

  return <InitializingDisplay />
}
