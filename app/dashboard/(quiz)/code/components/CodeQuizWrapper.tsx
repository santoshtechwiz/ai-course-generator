"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useQuiz } from "@/hooks/useQuizState"
import { useSession } from "next-auth/react"
import CodingQuiz from "./CodingQuiz"

import type { CodeQuizWrapperProps, CodeQuizQuestion } from "@/app/types/code-quiz-types"
import { LoadingDisplay, ErrorDisplay, InitializingDisplay, QuizNotFoundDisplay, EmptyQuestionsDisplay } from "../../components/QuizStateDisplay"

export default function CodeQuizWrapper({ quizData: initialQuizData, slug, userId, quizId }: CodeQuizWrapperProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isInitializing, setIsInitializing] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [localQuizData, setLocalQuizData] = useState(initialQuizData)
  const [localCurrentQuestion, setLocalCurrentQuestion] = useState(0)
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [localAnswers, setLocalAnswers] = useState<
    Array<{
      questionId: string
      answer: string
      isCorrect: boolean
      timeSpent: number
    }>
  >([])

  const {
    quizData,
    currentQuestion,
    isCompleted,
    error: quizError,
    nextQuestion,
    saveAnswer,
    submitQuiz,
    loadQuiz,
  } = useQuiz()

  // Check authentication
  useEffect(() => {
    if (status === "loading") return

    if (!session && typeof window !== "undefined") {
      // Store current path for redirect after login
      sessionStorage.setItem("quizRedirectPath", window.location.pathname)
      // Redirect to login if not authenticated
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
    }
  }, [session, status, router])

  // Prefer quizData from state, fallback to initialQuizData or localQuizData
  const validQuizData = useMemo(() => {
    const data = quizData || localQuizData || initialQuizData

    if (!data) {
      console.error("No quiz data available")
      return null
    }

    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      console.error("Quiz has no questions:", data)
      return null
    }

    return data
  }, [quizData, localQuizData, initialQuizData])

  useEffect(() => {
    if (hasInitialized) return

    const run = async () => {
      try {
        setInitError(null)
        setSubmissionError(null)

        // If we already have valid initial data, use it
        if (initialQuizData && Array.isArray(initialQuizData.questions) && initialQuizData.questions.length > 0) {
          console.log("Using initial quiz data with", initialQuizData.questions.length, "questions")
          setLocalQuizData(initialQuizData)
          setHasInitialized(true)
          setIsInitializing(false)
          return
        }

        // Otherwise load from API
        console.log("Loading quiz data for slug:", slug)
        if (!slug) {
          setInitError("Quiz ID is missing")
          setHasInitialized(true)
          setIsInitializing(false)
          return
        }

        try {
          const result = await loadQuiz(slug, "code")
          if (result) {
            console.log("Quiz loaded successfully with", result.questions?.length, "questions")
            setLocalQuizData(result)
          } else {
            console.error("Failed to load quiz data")
            setInitError("Failed to load quiz data. Please try again.")
          }
        } catch (error) {
          console.error("Error loading quiz:", error)
          setInitError("Failed to load quiz. Please try again.")
        }
      } catch (error) {
        console.error("Error initializing quiz:", error)
        setInitError("An error occurred while initializing the quiz.")
      } finally {
        setHasInitialized(true)
        setIsInitializing(false)
      }
    }

    run()
  }, [hasInitialized, initialQuizData, slug, loadQuiz])

  const handleAnswer = useCallback(
    async (answer: string, timeSpent: number, isCorrect: boolean) => {
      try {
        setSubmissionError(null)

        if (!validQuizData) {
          setInitError("Quiz data is not available")
          return
        }

        // Use local state for current question
        const currentQ = validQuizData.questions[localCurrentQuestion] as CodeQuizQuestion

        if (!currentQ) {
          console.error("Current question not found:", { currentQuestion: localCurrentQuestion })
          setInitError("Current question not found")
          return
        }

        console.log("Processing answer for question", localCurrentQuestion + 1, "of", validQuizData.questions.length)

        // Store answer in local state
        const questionId = currentQ.id || String(localCurrentQuestion)
        const newAnswer = {
          questionId,
          answer,
          isCorrect,
          timeSpent,
        }

        // Update local answers array
        setLocalAnswers((prev) => {
          const existingIndex = prev.findIndex((a) => a.questionId === questionId)
          if (existingIndex >= 0) {
            // Replace existing answer
            const updated = [...prev]
            updated[existingIndex] = newAnswer
            return updated
          } else {
            // Add new answer
            return [...prev, newAnswer]
          }
        })

        // Save answer to Redux store (but don't submit to API yet)
        saveAnswer(questionId, answer)

        const isLast = localCurrentQuestion + 1 >= validQuizData.questions.length

        if (isLast) {
          console.log("Last question answered, submitting quiz")
          try {
            // Only submit the quiz at the end
            if (session) {
              // If user is authenticated, submit to database
              await submitQuiz()
            }
            // Navigate to results page
            router.replace(`/dashboard/code/${slug}/results`)
          } catch (error) {
            console.error("Error submitting quiz:", error)
            setSubmissionError("Failed to submit quiz. Please try again.")
          }
        } else {
          console.log("Moving to next question:", localCurrentQuestion + 1)
          // Just move to the next question without submitting to API
          setLocalCurrentQuestion((prev) => prev + 1)
          nextQuestion()
        }
      } catch (error) {
        console.error("Error in handleAnswer:", error)
        setSubmissionError("Failed to process your answer. Please try again.")
      }
    },
    [validQuizData, localCurrentQuestion, saveAnswer, submitQuiz, nextQuestion, router, slug, session],
  )

  const handleRetrySubmission = useCallback(() => {
    setSubmissionError(null)
  }, [])

  const currentQuestionObj = useMemo(() => {
    if (!validQuizData) return null

    // Use local state for current question
    const question = validQuizData.questions[localCurrentQuestion]
    if (!question) {
      console.error("Question not found at index:", localCurrentQuestion)
      return null
    }

    return question
  }, [validQuizData, localCurrentQuestion])

  // Handle authentication loading state
  if (status === "loading") {
    return <LoadingDisplay message="Checking authentication..." />
  }

  // Handle authentication errors
  if (status === "unauthenticated") {
    return (
      <ErrorDisplay
        error="Please sign in to access this quiz"
        onRetry={() => router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`)}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  if (initError) {
    return (
      <ErrorDisplay
        error={initError}
        onRetry={() => window.location.reload()}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  if (isInitializing || !hasInitialized) return <InitializingDisplay />

  if (!slug) return <QuizNotFoundDisplay onReturn={() => router.push("/dashboard/quizzes")} />

  if (!validQuizData) {
    return (
      <EmptyQuestionsDisplay
        message="No Questions Available"
        description="We couldn't find any questions for this quiz. This could be because the quiz is still being generated or there was an error."
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  if (quizError || submissionError) {
    return (
      <ErrorDisplay
        error={submissionError || quizError}
        onRetry={submissionError ? handleRetrySubmission : () => window.location.reload()}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  if (!currentQuestionObj) {
    return <InitializingDisplay message="Loading question..." />
  }

  return (
    <CodingQuiz
      question={{
        ...currentQuestionObj,
        id: currentQuestionObj.id || `question-${localCurrentQuestion}`,
      }}
      onAnswer={handleAnswer}
      questionNumber={localCurrentQuestion + 1}
      totalQuestions={validQuizData.questions.length}
      isLastQuestion={localCurrentQuestion === validQuizData.questions.length - 1}
    />
  )
}
