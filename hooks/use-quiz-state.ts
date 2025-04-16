"use client"

// Create a new hook for standardized quiz state management
import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useQuizResult } from "./use-quiz-result"
import type { QuizType } from "@/app/types/types"

interface UseQuizStateOptions<T> {
  quizId: string | number
  slug: string
  questions: T[]
  quizType: QuizType
  calculateScore: (selectedOptions: any[], questions: T[]) => number
  onComplete?: () => void
}

export function useQuizState<T>({
  quizId,
  slug,
  questions,
  quizType,
  calculateScore,
  onComplete,
}: UseQuizStateOptions<T>) {
  // Quiz progress state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<any[]>(Array(questions.length).fill(null))
  const [timeSpent, setTimeSpent] = useState<number[]>(Array(questions.length).fill(0))
  const [startTime, setStartTime] = useState<number>(Date.now())
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizResults, setQuizResults] = useState<any | null>(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  // Authentication state
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"

  // Quiz submission state
  const { submitQuizResult, isSubmitting, isSuccess, isError, errorMessage, result, resetSubmissionState } =
    useQuizResult({})

  // Current question
  const currentQuestion = questions[currentQuestionIndex]

  // Initialize timer for current question
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent((prev) => {
        const updated = [...prev]
        updated[currentQuestionIndex] = (Date.now() - questionStartTime) / 1000
        return updated
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentQuestionIndex, questionStartTime])

  // Handle option selection
  const handleSelectOption = useCallback(
    (value: string) => {
      setSelectedOptions((prev) => {
        const updated = [...prev]
        updated[currentQuestionIndex] = value
        return updated
      })
    },
    [currentQuestionIndex],
  )

  // Handle moving to next question or completing quiz
  const handleNextQuestion = useCallback(() => {
    // Finalize time spent on current question
    const finalTimeSpent = (Date.now() - questionStartTime) / 1000
    setTimeSpent((prev) => {
      const updated = [...prev]
      updated[currentQuestionIndex] = finalTimeSpent
      return updated
    })

    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex((prev) => prev + 1)
      setQuestionStartTime(Date.now())
    } else {
      // Complete quiz
      const totalTime = (Date.now() - startTime) / 1000
      const score = calculateScore(selectedOptions, questions)

      setQuizResults({
        score,
        totalTime,
        elapsedTime: totalTime,
        answers: selectedOptions.map((option, index) => ({
          answer: option,
          timeSpent: timeSpent[index],
          isCorrect: quizType === "mcq" ? option === (questions[index] as any).answer : undefined,
        })),
      })

      if (isAuthenticated) {
        // Submit results if authenticated
        submitQuizResult(
          quizId.toString(),
          selectedOptions.map((option, index) => ({
            answer: quizType === "mcq" ? (questions[index] as any).answer : option,
            userAnswer: option,
            isCorrect: quizType === "mcq" ? option === (questions[index] as any).answer : undefined,
            timeSpent: timeSpent[index],
          })),
          totalTime,
          score,
          quizType,
        )
        setShowFeedbackModal(true)
      } else {
        // Just complete the quiz without submission for unauthenticated users
        setQuizCompleted(true)
      }

      if (onComplete) {
        onComplete()
      }
    }
  }, [
    currentQuestionIndex,
    questions,
    questionStartTime,
    startTime,
    selectedOptions,
    timeSpent,
    calculateScore,
    isAuthenticated,
    quizId,
    submitQuizResult,
    quizType,
    onComplete,
  ])

  // Handle feedback modal continuation
  const handleFeedbackContinue = useCallback(() => {
    setShowFeedbackModal(false)
    setQuizCompleted(true)
    resetSubmissionState()
  }, [resetSubmissionState])

  // Format time for display
  const formatQuizTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return {
    // State
    currentQuestionIndex,
    currentQuestion,
    selectedOptions,
    timeSpent,
    quizCompleted,
    quizResults,
    showFeedbackModal,
    isSubmitting,
    isSuccess,
    isError,
    errorMessage,
    isAuthenticated,
    session,

    // Actions
    handleSelectOption,
    handleNextQuestion,
    handleFeedbackContinue,
    formatQuizTime,
  }
}

// Export the time formatter as a standalone function
export function formatQuizTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}
