"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useIdleTimer } from "@/hooks/use-idle-timer"
import { useVisibilityChange } from "@/hooks/use-visibility-change"
import type { QuizAnswer } from "@/app/(quiz)/components/QuizBase"

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
  quizId: string | number
  questions: T[]
  slug: string
  quizType: string
  timeLimit?: number
  calculateScore?: (selectedOptions: (string | null)[], questions: T[]) => number
  onComplete?: () => void
  onSubmitAnswer?: (answer: QuizAnswer) => void
}

function useQuizState<T extends Question>({
  quizId,
  questions,
  slug,
  quizType,
  timeLimit,
  calculateScore,
  onComplete,
  onSubmitAnswer,
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

  const { data: session } = useSession()
  const isAuthenticated = !!session
  const router = useRouter()

  // Get the current question
  const currentQuestion = questions[currentQuestionIndex]

  // Refs for tracking time and preventing duplicate submissions
  const startTimeRef = useRef<number>(Date.now())
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const submissionInProgress = useRef(false)

  // Default score calculation if not provided
  const defaultCalculateScore = useCallback((selectedOptions: (string | null)[], questions: T[]) => {
    return selectedOptions.reduce((score, selected, index) => {
      const correctAnswer = questions[index]?.correctAnswer || questions[index]?.answer
      return score + (selected === correctAnswer ? 1 : 0)
    }, 0)
  }, [])

  const scoreCalculator = calculateScore || defaultCalculateScore

  // Load saved state from session storage
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
          startTimeRef.current = parsedState.startTime || Date.now()
        } catch (error) {
          console.error("Error parsing saved quiz state:", error)
          // If there's an error parsing, just continue with default state
        }
      }
    }
  }, [questions.length, slug, quizType])

  // Start timer for the current question
  useEffect(() => {
    if (!quizCompleted) {
      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      // Set up a new timer that updates every second
      timerRef.current = setInterval(() => {
        setTimeSpent((prev) => {
          const newTimeSpent = [...prev]
          newTimeSpent[currentQuestionIndex] = (prev[currentQuestionIndex] || 0) + 1
          return newTimeSpent
        })
      }, 1000)

      // Clean up the timer when the component unmounts or when the question changes
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      }
    }
  }, [currentQuestionIndex, quizCompleted])

  // Save state to session storage
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
        startTime: startTimeRef.current,
      }
      sessionStorage.setItem(storageKey, JSON.stringify(stateToSave))
    }
  }, [currentQuestionIndex, selectedOptions, timeSpent, quizCompleted, quizResults, showFeedbackModal, slug, quizType])

  // Handle idle time
  useIdleTimer({
    onIdle: () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    },
    onActive: () => {
      if (!timerRef.current && !quizCompleted) {
        timerRef.current = setInterval(() => {
          setTimeSpent((prev) => {
            const newTimeSpent = [...prev]
            newTimeSpent[currentQuestionIndex] = (prev[currentQuestionIndex] || 0) + 1
            return newTimeSpent
          })
        }, 1000)
      }
    },
    idleTime: 60, // 60 seconds of inactivity
  })

  // Handle visibility changes (tab switching)
  useVisibilityChange({
    onHidden: () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    },
    onVisible: () => {
      if (!timerRef.current && !quizCompleted) {
        timerRef.current = setInterval(() => {
          setTimeSpent((prev) => {
            const newTimeSpent = [...prev]
            newTimeSpent[currentQuestionIndex] = (prev[currentQuestionIndex] || 0) + 1
            return newTimeSpent
          })
        }, 1000)
      }
    },
  })

  const handleSelectOption = useCallback(
    (option: string) => {
      setSelectedOptions((prev) => {
        const newSelectedOptions = [...prev]
        newSelectedOptions[currentQuestionIndex] = option
        return newSelectedOptions
      })
    },
    [currentQuestionIndex],
  )

  const handleNextQuestion = useCallback(() => {
    // Prevent multiple submissions
    if (submissionInProgress.current) {
      console.log("Submission already in progress, ignoring request")
      return
    }

    // Get the current question and selected option
    const currentQuestion = questions[currentQuestionIndex] as any
    const selectedOption = selectedOptions[currentQuestionIndex]
    const correctAnswer = currentQuestion?.correctAnswer || currentQuestion?.answer
    const isCorrect = selectedOption === correctAnswer

    // Create the answer object
    const answer: QuizAnswer = {
      answer: correctAnswer || "",
      userAnswer: selectedOption || "",
      isCorrect,
      timeSpent: timeSpent[currentQuestionIndex] || 0,
    }

    // Call the onSubmitAnswer callback if provided
    if (onSubmitAnswer) {
      onSubmitAnswer(answer)
    }

    if (currentQuestionIndex < questions.length - 1) {
      // Move to the next question
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1)
    } else {
      // Set flag to prevent duplicate submissions
      submissionInProgress.current = true
      setIsSubmitting(true)

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

      // Use setTimeout to ensure state updates have time to process
      setTimeout(() => {
        setQuizCompleted(true)
        setShowFeedbackModal(true)
        setIsSubmitting(false)
        submissionInProgress.current = false

        if (onComplete) {
          onComplete()
        }
      }, 100)
    }
  }, [currentQuestionIndex, questions, selectedOptions, timeSpent, scoreCalculator, onComplete, onSubmitAnswer])

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
    submissionInProgress.current = false

    // Reset the timer
    startTimeRef.current = Date.now()

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
