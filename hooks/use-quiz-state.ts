"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

interface Question {
  id: number
  text: string
  options: string[]
  correctAnswer: string
  explanation?: string
}

interface QuizResults {
  correctAnswers: number
  totalQuestions: number
  score: number
  timeTaken: number[]
}

interface UseQuizStateProps {
  questions: Question[]
  slug: string
  quizType: string
  timeLimit?: number
}

const useQuizState = ({ questions = [], slug, quizType, timeLimit }: UseQuizStateProps) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<string[]>(Array(questions.length).fill(null))
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

  const currentQuestion = questions[currentQuestionIndex] || null

  useEffect(() => {
    if (questions.length === 0) return // Avoid running effects if no questions are provided

    if (typeof window !== "undefined") {
      const storageKey = `quiz_${slug}_${quizType}`
      const savedState = sessionStorage.getItem(storageKey)

      if (savedState) {
        const parsedState = JSON.parse(savedState)
        setCurrentQuestionIndex(parsedState.currentQuestionIndex || 0)
        setSelectedOptions(parsedState.selectedOptions || Array(questions.length).fill(null))
        setTimeSpent(parsedState.timeSpent || Array(questions.length).fill(0))
        setQuizCompleted(parsedState.quizCompleted || false)
        setQuizResults(parsedState.quizResults || null)
        setShowFeedbackModal(parsedState.showFeedbackModal || false)
        setStartTime(parsedState.startTime || Date.now())
      }
    }
  }, [questions.length, slug, quizType])

  useEffect(() => {
    if (questions.length === 0 || quizCompleted || typeof window === "undefined") return

    const intervalId = setInterval(() => {
      setTimeSpent((prevTimeSpent) => {
        const newTimeSpent = [...prevTimeSpent]
        newTimeSpent[currentQuestionIndex] = (prevTimeSpent[currentQuestionIndex] || 0) + 1
        return newTimeSpent
      })
    }, 1000)

    return () => clearInterval(intervalId)
  }, [currentQuestionIndex, quizCompleted, questions.length])

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
    } else if (questions.length > 0) {
      // Calculate results and complete quiz
      let correctAnswers = 0
      questions.forEach((question, index) => {
        if (question.correctAnswer === selectedOptions[index]) {
          correctAnswers++
        }
      })

      const score = (correctAnswers / questions.length) * 100
      const totalTimeTaken = timeSpent.reduce((acc, curr) => acc + curr, 0)

      setQuizResults({
        correctAnswers,
        totalQuestions: questions.length,
        score,
        timeTaken: timeSpent,
      })
      setQuizCompleted(true)
      setShowFeedbackModal(true)
    }
  }, [currentQuestionIndex, questions, selectedOptions, timeSpent])

  const handleFeedbackContinue = useCallback(() => {
    setShowFeedbackModal(false)
  }, [])

  // Add a handleRestart function to the useQuizState hook
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

  // Add handleRestart to the returned object
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
    handleRestart, // Add this line
  }
}

export default useQuizState
