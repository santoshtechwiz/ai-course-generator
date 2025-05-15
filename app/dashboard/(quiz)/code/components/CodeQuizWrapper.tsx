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
}

export default function CodeQuizWrapper({ slug }: CodeQuizWrapperProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [authChecked, setAuthChecked] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Redux quiz state/actions
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
    previousQuestion,
    resetQuizState,
    userAnswers,
  } = useQuiz()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      sessionStorage.setItem("quizRedirectPath", window.location.pathname)
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
    } else if (status === "authenticated") {
      setAuthChecked(true)
    }
  }, [status, router])

  // Load quiz data if not loaded
  useEffect(() => {
    if (authChecked && !quizData && !isLoading && !error) {
      loadQuiz(slug, "code").catch((err) => {
        setErrorMessage("Failed to load quiz")
      })
    }
  }, [authChecked, quizData, slug, loadQuiz, isLoading, error])

  // Clean up on unmount or when navigating away
  useEffect(() => {
    return () => {
      if (!window.location.pathname.includes(`/dashboard/code/${slug}`)) {
        resetQuizState()
      }
    }
  }, [resetQuizState, slug])

  // Handle answer submission (for MCQ/code quiz)
  const handleAnswer = useCallback(
    (answer: string, elapsedTime: number, isCorrect: boolean) => {
      if (!quizData || currentQuestion === undefined) return
      const currentQuestionData = quizData.questions[currentQuestion]
      saveAnswer(currentQuestionData.id, answer)
      const isLastQuestion = currentQuestion === quizData.questions.length - 1
      if (isLastQuestion) {
        submitQuiz(quizData.slug)
        router.replace(`/dashboard/code/${slug}/results`)
      } else {
        nextQuestion()
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

  if (status === "unauthenticated") {
    return (
      <ErrorDisplay
        error="Please sign in to access this quiz"
        onRetry={() => router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`)}
        onReturn={handleReturn}
      />
    )
  }

  if (isLoading || status === "loading" || !authChecked) {
    return <InitializingDisplay />
  }

  if (error || errorMessage) {
    return (
      <ErrorDisplay
        error={error || errorMessage || "An error occurred"}
        onRetry={handleRetry}
        onReturn={handleReturn}
      />
    )
  }

  if (quizData && (!quizData.questions || quizData.questions.length === 0)) {
    return <EmptyQuestionsDisplay onReturn={handleReturn} />
  }

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
        prevQuestion={previousQuestion}
      />
    )
  }

  return <InitializingDisplay />
}
