"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useQuizResult } from "@/hooks/use-quiz-result"

export type QuizType = "code" | "mcq" | "blanks" | "openended" | "flashcard"

export interface QuizAnswer {
  answer: string | string[]
  isCorrect: boolean
  timeSpent: number
  hintsUsed?: boolean | number
  questionId?: number | string
}

export interface BaseQuizProps {
  quizId: string | number
  slug: string
  title: string
  questions: any[]
  onComplete?: () => void
  onSubmitAnswer?: (answer: any) => void
}

export function useQuizState({
  quizId,
  slug,
  questions,
  quizType,
  calculateScore,
  onComplete,
}: {
  quizId: string | number
  slug: string
  questions: any[]
  quizType: QuizType
  calculateScore: (selectedOptions: (string | null)[], questions: any[]) => number
  onComplete?: () => void
}) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<(string | null)[]>(new Array(questions.length).fill(null))
  const [startTimes, setStartTimes] = useState<number[]>(new Array(questions.length).fill(Date.now()))
  const [timeSpent, setTimeSpent] = useState<number[]>(new Array(questions.length).fill(0))
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [quizResults, setQuizResults] = useState<any>(null)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [hintsUsed, setHintsUsed] = useState<number[]>(new Array(questions.length).fill(0))
  const [flipped, setFlipped] = useState(false)
  const [selfRating, setSelfRating] = useState<Record<string, "correct" | "incorrect" | null>>({})

  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"
  const userId = session?.user?.id || "guest"

  const { submitQuizResult, isSubmitting, isSuccess, isError, errorMessage, resetSubmissionState } = useQuizResult()

  const currentQuestion = useMemo(() => {
    return questions[currentQuestionIndex] || null
  }, [currentQuestionIndex, questions])

  useEffect(() => {
    setStartTimes((prev) => {
      const newStartTimes = [...prev]
      newStartTimes[currentQuestionIndex] = Date.now()
      return newStartTimes
    })

    const savedResults = localStorage.getItem(`quizResults-${userId}-${quizId}`)
    if (savedResults) {
      try {
        setQuizResults(JSON.parse(savedResults))
        setQuizCompleted(true)
      } catch (error) {
        console.error("Error parsing saved quiz results:", error)
      }
    }
  }, [userId, quizId, currentQuestionIndex])

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

  const handleUseHint = useCallback(() => {
    setHintsUsed((prev) => {
      const newHintsUsed = [...prev]
      newHintsUsed[currentQuestionIndex] = (newHintsUsed[currentQuestionIndex] || 0) + 1
      return newHintsUsed
    })
  }, [currentQuestionIndex])

  const handleFlip = useCallback(() => {
    setFlipped((prev) => !prev)
  }, [])

  const handleSelfRating = useCallback((cardId: string, rating: "correct" | "incorrect") => {
    setSelfRating((prev) => ({
      ...prev,
      [cardId]: rating,
    }))
  }, [])

  const handleNextQuestion = useCallback(
    async (answerData?: any) => {
      const currentTime = Date.now()
      const timeSpentOnQuestion = Math.round((currentTime - startTimes[currentQuestionIndex]) / 1000)

      setTimeSpent((prev) => {
        const newTimeSpent = [...prev]
        newTimeSpent[currentQuestionIndex] = timeSpentOnQuestion
        return newTimeSpent
      })

      // Use provided answer data or create default
      const answer = answerData || {
        answer: selectedOptions[currentQuestionIndex] || "",
        isCorrect: selectedOptions[currentQuestionIndex] === currentQuestion?.answer,
        timeSpent: timeSpentOnQuestion,
        hintsUsed: hintsUsed[currentQuestionIndex] || 0,
      }

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prevIndex) => prevIndex + 1)
        setFlipped(false)
        setStartTimes((prev) => {
          const newStartTimes = [...prev]
          newStartTimes[currentQuestionIndex + 1] = Date.now()
          return newStartTimes
        })
      } else {
        try {
          const correctCount = calculateScore(selectedOptions, questions)
          const score = (correctCount / questions.length) * 100
          const totalTimeSpent =
            timeSpent.reduce((sum, time) => sum + time, 0) + (Date.now() - startTimes[currentQuestionIndex]) / 1000

          const answers = selectedOptions.map((answer, index) => ({
            questionId: questions[index]?.id,
            userAnswer: answer || "",
            isCorrect: answer === questions[index]?.answer,
            timeSpent: index === currentQuestionIndex ? (Date.now() - startTimes[index]) / 1000 : timeSpent[index],
            hintsUsed: hintsUsed[index] || 0,
          }))

          if (isAuthenticated) {
            setShowFeedbackModal(true)
            await submitQuizResult(quizId.toString(), answers, Math.round(totalTimeSpent), correctCount, quizType)

            setQuizResults({
              slug,
              quizId,
              answers,
              elapsedTime: Math.round(totalTimeSpent),
              score,
              type: quizType,
            })
          } else {
            const results = {
              slug,
              quizId,
              answers,
              elapsedTime: Math.round(totalTimeSpent),
              score,
              type: quizType,
            }
            localStorage.setItem(`quizResults-${userId}-${quizId}`, JSON.stringify(results))
            setQuizResults(results)
            setQuizCompleted(true)
            if (onComplete) onComplete()
          }
        } catch (error) {
          console.error("Error submitting quiz data:", error)
        }
      }
    },
    [
      currentQuestionIndex,
      questions,
      quizId,
      selectedOptions,
      calculateScore,
      startTimes,
      timeSpent,
      slug,
      isAuthenticated,
      submitQuizResult,
      currentQuestion?.answer,
      onComplete,
      userId,
      quizType,
      hintsUsed,
    ],
  )

  const handleFeedbackContinue = useCallback(
    (proceed: boolean) => {
      setShowFeedbackModal(false)
      setQuizCompleted(true)
      if (onComplete) onComplete()
      resetSubmissionState?.()
      return proceed
    },
    [onComplete, resetSubmissionState],
  )

  const restartQuiz = useCallback(() => {
    localStorage.removeItem(`quizResults-${userId}-${quizId}`)
    setCurrentQuestionIndex(0)
    setSelectedOptions(new Array(questions.length).fill(null))
    setStartTimes(new Array(questions.length).fill(Date.now()))
    setTimeSpent(new Array(questions.length).fill(0))
    setHintsUsed(new Array(questions.length).fill(0))
    setFlipped(false)
    setQuizCompleted(false)
    setQuizResults(null)
    resetSubmissionState?.()
  }, [questions.length, userId, quizId, resetSubmissionState])

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
    hintsUsed,
    flipped,
    selfRating,
    handleSelectOption,
    handleNextQuestion,
    handleFeedbackContinue,
    handleUseHint,
    handleFlip,
    handleSelfRating,
    restartQuiz,
    calculateScore,
    setCurrentQuestionIndex,
  }
}

// Helper function to format quiz time
export function formatQuizTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    return `${remainingSeconds}s`
  }
}
