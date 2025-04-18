"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Question {
  id?: number
  question: string
  options?: string[]
  correctAnswer?: string
  answer?: string
  codeSnippet?: string
  language?: string
  [key: string]: any
}

interface QuizResults {
  correctAnswers: number
  totalQuestions: number
  score: number
  timeTaken: number[]
  elapsedTime?: number
}

interface UseQuizStateProps<T extends Question> {
  questions: T[]
  slug: string
  quizType: string
  timeLimit?: number
  calculateScore?: (selectedOptions: (string | null)[], questions: T[]) => number
  onComplete?: () => void
}

function useQuizState<T extends Question>({
  questions,
  slug,
  quizType,
  timeLimit,
  calculateScore,
  onComplete,
}: UseQuizStateProps<T>) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<(string | null)[]>(Array(questions.length).fill(null))
  const [timeSpent, setTimeSpent] = useState<number[]>(Array(questions.length).fill(0))
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizResults, setQuizResults] = useState<QuizResults | null>(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [startTime, setStartTime] = useState(Date.now())

  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"
  const router = useRouter()

  const currentQuestion = questions[currentQuestionIndex]

  // Default score calculation if not provided
  const defaultCalculateScore = useCallback((selectedOptions: (string | null)[], questions: T[]) => {
    return selectedOptions.reduce((score, selected, index) => {
      const correctAnswer = questions[index]?.correctAnswer || questions[index]?.answer
      return score + (selected === correctAnswer ? 1 : 0)
    }, 0)
  }, [])

  const scoreCalculator = calculateScore || defaultCalculateScore

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storageKey = `quiz_${slug}_${quizType}`
      const savedState = sessionStorage.getItem(storageKey)

      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState)
          setCurrentQuestionIndex(parsedState.currentQuestionIndex || 0)
          setSelectedOptions(parsedState.selectedOptions || Array(questions.length).fill(null))
          setTimeSpent(parsedState.timeSpent || Array(questions.length).fill(0))
          setQuizCompleted(parsedState.quizCompleted || false)
          setQuizResults(parsedState.quizResults || null)
          setShowFeedbackModal(parsedState.showFeedbackModal || false)
          setStartTime(parsedState.startTime || Date.now())
        } catch (error) {
          console.error("Error parsing saved quiz state:", error)
          // If there's an error parsing, just continue with default state
        }
      }
    }
  }, [questions.length, slug, quizType])

  useEffect(() => {
    if (!quizCompleted && typeof window !== "undefined") {
      const intervalId = setInterval(() => {
        setTimeSpent((prevTimeSpent) => {
          const newTimeSpent = [...prevTimeSpent]
          newTimeSpent[currentQuestionIndex] = (prevTimeSpent[currentQuestionIndex] || 0) + 1
          return newTimeSpent
        })
      }, 1000)

      return () => clearInterval(intervalId)
    }
  }, [currentQuestionIndex, quizCompleted])

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storageKey = `quiz_${slug}_${quizType}`
      const stateToSave = {
        currentQuestionIndex,
        selectedOptions,
        timeSpent,
        quizCompleted,
        quizResults,
        showFeedbackModal,
        startTime,
      }
      sessionStorage.setItem(storageKey, JSON.stringify(stateToSave))
    }
  }, [
    currentQuestionIndex,
    selectedOptions,
    timeSpent,
    quizCompleted,
    quizResults,
    showFeedbackModal,
    slug,
    quizType,
    startTime,
  ])

  const handleSelectOption = useCallback(
    (option: string) => {
      setSelectedOptions((prevSelectedOptions) => {
        const newSelectedOptions = [...prevSelectedOptions]
        newSelectedOptions[currentQuestionIndex] = option
        return newSelectedOptions
      })
    },
    [currentQuestionIndex],
  )

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1)
    } else {
      // Calculate results and complete quiz
      const correctAnswers = scoreCalculator(selectedOptions, questions)
      const score = (correctAnswers / questions.length) * 100
      const totalTimeTaken = timeSpent.reduce((acc, curr) => acc + curr, 0)

      setQuizResults({
        correctAnswers,
        totalQuestions: questions.length,
        score,
        timeTaken: timeSpent,
        elapsedTime: totalTimeTaken,
      })
      setQuizCompleted(true)
      setShowFeedbackModal(true)

      if (onComplete) {
        onComplete()
      }
    }
  }, [currentQuestionIndex, questions, selectedOptions, timeSpent, scoreCalculator, onComplete])

  const handleFeedbackContinue = useCallback(() => {
    setShowFeedbackModal(false)
  }, [])

  const handleRestart = useCallback(() => {
    // Reset all state
    setCurrentQuestionIndex(0)
    setSelectedOptions(Array(questions.length).fill(null))
    setTimeSpent(Array(questions.length).fill(0))
    setQuizCompleted(false)
    setQuizResults(null)
    setShowFeedbackModal(false)
    setIsSubmitting(false)
    setIsSuccess(false)
    setIsError(false)
    setErrorMessage(null)

    // Reset the timer
    setStartTime(Date.now())

    // Clear any saved state in session storage
    if (typeof window !== "undefined") {
      const storageKey = `quiz_${slug}_${quizType}`
      sessionStorage.removeItem(storageKey)
    }
  }, [questions.length, slug, quizType])

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

export default useQuizState
