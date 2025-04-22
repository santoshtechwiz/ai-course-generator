"use client"

import { useQuiz } from "@/app/context/QuizContext"
import { submitQuizResult } from "@/lib/quiz-result-service"
import { useSession } from "next-auth/react"
import { useState, useRef, useEffect, useCallback } from "react"


interface UseQuizStateProps {
  questions: any[]
  quizType: "mcq" | "openended" | "fill-blanks" | "code" | "flashcard"
  calculateScore: (selectedOptions: (string | null)[], questions: any[]) => number
  onComplete?: () => void
  onSubmitAnswer?: (answer: any) => void
}

export default function useQuizState({
  questions,
  quizType,
  calculateScore,
  onComplete,
  onSubmitAnswer,
}: UseQuizStateProps) {
  // Get the quiz context
  const { state, dispatch, nextQuestion, prevQuestion, submitAnswer: contextSubmitAnswer } = useQuiz()

  // Local state
  const [selectedOptions, setSelectedOptions] = useState<(string | null)[]>(new Array(questions.length).fill(null))
  const [timeSpent, setTimeSpent] = useState<number[]>(new Array(questions.length).fill(0))
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizResults, setQuizResults] = useState<any>(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"
  const startTimeRef = useRef<number>(Date.now())
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const currentQuestionIndex = state.currentQuestionIndex

  // Initialize timer for the current question
  useEffect(() => {
    startTimeRef.current = Date.now()

    // Start timer for the current question
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
      const newTimeSpent = [...timeSpent]
      newTimeSpent[currentQuestionIndex] = elapsed
      setTimeSpent(newTimeSpent)
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [currentQuestionIndex])

  // Get the current question
  const currentQuestion = questions[currentQuestionIndex] || null

  // Handle selecting an option
  const handleSelectOption = useCallback(
    (option: string) => {
      const newSelectedOptions = [...selectedOptions]
      newSelectedOptions[currentQuestionIndex] = option
      setSelectedOptions(newSelectedOptions)

      if (onSubmitAnswer) {
        onSubmitAnswer({
          answer: option,
          timeSpent: timeSpent[currentQuestionIndex],
          isCorrect: option === currentQuestion?.answer,
        })
      }
    },
    [currentQuestion, currentQuestionIndex, onSubmitAnswer, selectedOptions, timeSpent],
  )

  // Handle moving to the next question
  const handleNextQuestion = useCallback(
    (nextIndex?: number) => {
      // If a specific index is provided, use it
      if (nextIndex !== undefined) {
        dispatch({ type: "SET_CURRENT_QUESTION", payload: nextIndex })
        return
      }

      // If this is the last question, complete the quiz
      if (currentQuestionIndex >= questions.length - 1) {
        completeQuiz()
        return
      }

      // Otherwise, move to the next question
      nextQuestion()
    },
    [currentQuestionIndex, dispatch, nextQuestion, questions.length],
  )

  // Complete the quiz
  const completeQuiz = useCallback(async () => {
    setIsSubmitting(true)

    try {
      // Calculate score
      const score = calculateScore(selectedOptions, questions)

      // Save results if authenticated
      if (isAuthenticated) {
        await submitQuizResult({
          quizId: state.quizId,
          slug: state.slug,
          answers: selectedOptions.map((option, index) => ({
            answer: option || "",
            timeSpent: timeSpent[index],
            isCorrect: option === questions[index]?.answer,
          })),
          totalTime: timeSpent.reduce((sum, time) => sum + time, 0),
          score,
          type: quizType,
          totalQuestions: questions.length,
        })
      }

      // Set results
      setQuizResults({
        score,
        timeTaken: timeSpent,
        correctAnswers: selectedOptions.filter((option, index) => option === questions[index]?.answer).length,
        totalQuestions: questions.length,
      })

      setIsSuccess(true)
      setQuizCompleted(true)
      setShowFeedbackModal(true)

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error("Error completing quiz:", error)
      setIsError(true)
      setErrorMessage(error instanceof Error ? error.message : "An error occurred")
      setShowFeedbackModal(true)
    } finally {
      setIsSubmitting(false)
    }
  }, [
    calculateScore,
    isAuthenticated,
    onComplete,
    questions,
    quizType,
    selectedOptions,
    state.quizId,
    state.slug,
    timeSpent,
  ])

  // Handle feedback modal continue button
  const handleFeedbackContinue = useCallback(() => {
    setShowFeedbackModal(false)
  }, [])

  // Handle restarting the quiz
  const handleRestart = useCallback(() => {
    // Reset all state
    setSelectedOptions(new Array(questions.length).fill(null))
    setTimeSpent(new Array(questions.length).fill(0))
    setQuizCompleted(false)
    setQuizResults(null)
    setShowFeedbackModal(false)
    setIsSubmitting(false)
    setIsSuccess(false)
    setIsError(false)
    setErrorMessage(null)

    // Reset quiz context
    dispatch({ type: "RESET_QUIZ" })

    // Reset timer
    startTimeRef.current = Date.now()
  }, [dispatch, questions.length])

  return {
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
    handleSelectOption,
    handleNextQuestion,
    handleFeedbackContinue,
    handleRestart,
  }
}
