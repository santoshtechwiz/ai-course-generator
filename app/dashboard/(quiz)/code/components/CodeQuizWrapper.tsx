"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

import { useQuiz } from "@/hooks/useQuizState"
import { InitializingDisplay, EmptyQuestionsDisplay, ErrorDisplay } from "../../components/QuizStateDisplay"
import CodingQuiz from "./CodingQuiz"
import NonAuthenticatedUserSignInPrompt from "../../components/NonAuthenticatedUserSignInPrompt"

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

  useEffect(() => {
    if (status === "unauthenticated") {
      sessionStorage.setItem("quizRedirectPath", window.location.pathname)
    } else if (status === "authenticated") {
      setAuthChecked(true)
    }
  }, [status])

  // ✅ Fix: Ensure proper normalized quizData shape
  useEffect(() => {
    if (authChecked && !quizState && !isLoading && !error) {
      if (quizData && Array.isArray(quizData?.questions)) {
        loadQuiz(slug, "code", {
          id: quizId,
          title: quizData.title,
          slug,
          type: "code",
          questions: quizData.questions,
          isPublic: isPublic ?? false,
          isFavorite: isFavorite ?? false,
          ownerId: ownerId ?? "",
          timeLimit: quizData.timeLimit ?? null,
        })
      }
    }

    }, [
      authChecked,
      slug,
      quizId,
      quizData,
      isPublic,
      isFavorite,
      ownerId,
      quizState,
      isLoading,
      error,
      loadQuiz,
    ])

  useEffect(() => {
    return () => {
      if (!window.location.pathname.includes(`/dashboard/code/${slug}`)) {
        resetQuizState()
      }
    }
  }, [resetQuizState, slug])

  const questions = quizState?.questions || []
  const totalQuestions = questions.length
  const currentQuestionData = questions[currentQuestion] || null
  const isLastQuestion = currentQuestion === totalQuestions - 1

  const handleAnswer = useCallback(
    async (answer: string, elapsedTime: number, isCorrect: boolean) => {
      try {
        const question = questions[currentQuestion]
        if (!question?.id) {
          setErrorMessage("Invalid question data")
          return
        }

        await saveAnswer(question.id, answer)

        if (isLastQuestion) {
          await submitQuiz(slug)

          if (userId) {
            router.replace(`/dashboard/code/${slug}/results`)
          }
        } else {
          nextQuestion()
        }
      } catch (err) {
        console.error("Error handling answer:", err)
        setErrorMessage("Failed to submit answer")
      }
    },
    [questions, currentQuestion, saveAnswer, submitQuiz, router, slug, isLastQuestion, nextQuestion, userId]
  )

  const handleReturn = useCallback(() => {
    router.push("/dashboard/quizzes")
  }, [router])

  const handleRetry = useCallback(() => {
    window.location.reload()
  }, [])

  const handleSignIn = useCallback(() => {
    sessionStorage.setItem("quizRedirectPath", `/dashboard/code/${slug}/results`)
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/code/${slug}/results`)}`)
  }, [router, slug])

  if (status === "unauthenticated" && !authChecked) {
    return (
      <ErrorDisplay
        error="Please sign in to access this quiz"
        onRetry={handleSignIn}
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
        error={errorMessage || error || "An error occurred"}
        onRetry={handleRetry}
        onReturn={handleReturn}
      />
    )
  }

  if (!questions.length) {
    return <EmptyQuestionsDisplay onReturn={handleReturn} />
  }

  if (isCompleted) {
    if (userId) {
      router.replace(`/dashboard/code/${slug}/results`)
      return null
    }

    return (
      <NonAuthenticatedUserSignInPrompt
        quizType="code"
        onSignIn={handleSignIn}
        showSaveMessage
      />
    )
  }

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
