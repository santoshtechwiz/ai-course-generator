"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import McqQuiz from "./McqQuiz"
import McqQuizResult from "./McqQuizResult"
import { Card } from "@/components/ui/card"
import { Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useQuiz } from "@/app/context/QuizContext"
import GuestSignInPrompt from "../../components/GuestSignInPrompt"
import {
  createQuizError,
  QuizErrorType,
  getUserFriendlyErrorMessage,
  quizUtils,
  formatQuizTime,
  calculateTotalTime,
} from "@/lib/utils/quiz-index"
import React from "react"
import { useSelector } from "react-redux"
import { useToast } from "@/hooks/use-toast"

interface McqQuizWrapperProps {
  quizData?: any
  questions?: any[]
  quizId?: string
  slug: string
  error?: any
  quizResults?: any
  currentQuestionIndex?: number
  showResults?: boolean
}

/**
 * McqQuizWrapper - Handles the display and state management for MCQ quizzes
 */
export default function McqQuizWrapper({
  quizData,
  questions,
  quizId,
  slug,
  error: propError,
  quizResults: propQuizResults,
  currentQuestionIndex: propCurrentQuestionIndex,
  showResults: propShowResults,
}: McqQuizWrapperProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(propCurrentQuestionIndex || 0)
  const [answers, setAnswers] = useState<any[]>([])
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<any>(propError || null)
  const [showResults, setShowResults] = useState(propShowResults || false)
  const [quizResults, setQuizResults] = useState<any>(propQuizResults || null)
  const [startTime] = useState<number>(Date.now())
  const { toast } = useToast()

  // Use the quiz context for state management
  const {
    state: contextState,
    submitAnswer: submitQuizAnswer,
    completeQuiz,
    handleAuthenticationRequired,
    setAuthCheckComplete,
  } = useQuiz()

  // Fallback to Redux state if context state is undefined
  const reduxState = useSelector((state: any) => state.quiz)

  // Use context state if available, otherwise use Redux state
  const state = contextState || reduxState

  // Safety check - if neither state source is available, provide default values
  const safeState = state || {
    isCompleted: false,
    isAuthenticated: false,
    requiresAuth: false,
    isProcessingAuth: false,
    pendingAuthRequired: false,
    resultsSaved: false,
  }

  // Get questions from props or context
  const quizQuestions = questions || quizData?.questions || state?.questions || []

  // Initialize answers array on component mount
  useEffect(() => {
    if (quizQuestions && Array.isArray(quizQuestions) && quizQuestions.length > 0) {
      setAnswers(Array(quizQuestions.length).fill(null))
    }
  }, [quizQuestions])

  // Check if we should show results when state changes
  useEffect(() => {
    if (safeState.isCompleted && safeState.isAuthenticated) {
      setShowResults(true)
    }
  }, [safeState])

  // Check for URL parameters that indicate returning from auth
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const fromAuth = urlParams.get("fromAuth")

      if (fromAuth === "true" && safeState.isCompleted && safeState.pendingAuthRequired) {
        if (typeof setAuthCheckComplete === "function") {
          setAuthCheckComplete(true)
        }
        setShowResults(true)
      }
    }
  }, [safeState, setAuthCheckComplete])

  // Handle result saving notification
  useEffect(() => {
    if (safeState.isCompleted && safeState.isAuthenticated && !safeState.resultsSaved) {
      toast({
        title: "Quiz completed!",
        description: "Your results have been saved.",
      })
    }
  }, [safeState, toast])

  // Set quiz results from props if provided
  useEffect(() => {
    if (propQuizResults && !quizResults) {
      setQuizResults(propQuizResults)
      setShowResults(true)
    }
  }, [propQuizResults, quizResults])

  // Set error from props if provided
  useEffect(() => {
    if (propError && !error) {
      setError(propError)
    }
  }, [propError, error])

  // Set current question index from props if provided
  useEffect(() => {
    if (propCurrentQuestionIndex !== undefined) {
      setCurrentQuestionIndex(propCurrentQuestionIndex)
    }
  }, [propCurrentQuestionIndex])

  // Set show results from props if provided
  useEffect(() => {
    if (propShowResults !== undefined) {
      setShowResults(propShowResults)
    }
  }, [propShowResults])

  // Save quiz state to localStorage before redirecting to sign-in
  const saveQuizStateToLocalStorage = useCallback(() => {
    if (typeof window !== "undefined") {
      const stateToSave = {
        answers,
        currentQuestionIndex,
        quizId,
        slug,
        quizResults,
        completedAt: new Date().toISOString(),
      }
      localStorage.setItem(`quiz_state_${slug}`, JSON.stringify(stateToSave))
    }
  }, [answers, currentQuestionIndex, quizId, slug, quizResults])

  // Restore quiz state from localStorage when returning from sign-in
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const fromAuth = urlParams.get("fromAuth")

      if (fromAuth === "true") {
        try {
          const savedState = localStorage.getItem(`quiz_state_${slug}`)
          if (savedState) {
            const parsedState = JSON.parse(savedState)

            // Restore answers and other state
            if (parsedState.answers) setAnswers(parsedState.answers)
            if (parsedState.quizResults) setQuizResults(parsedState.quizResults)
            if (parsedState.currentQuestionIndex) setCurrentQuestionIndex(parsedState.currentQuestionIndex)

            // If we had completed the quiz before auth, complete it again
            if (parsedState.quizResults && completeQuiz) {
              completeQuiz({
                answers: parsedState.answers,
                score: parsedState.quizResults.score,
                completedAt: parsedState.completedAt || new Date().toISOString(),
              })
              setShowResults(true)
            }

            // Clear the saved state after restoring
            localStorage.removeItem(`quiz_state_${slug}`)
          }
        } catch (err) {
          console.error("Error restoring quiz state:", err)
        }
      }
    }
  }, [slug, completeQuiz])

  // Clear quiz state after results are saved to database
  useEffect(() => {
    if (safeState.resultsSaved && safeState.isAuthenticated) {
      // Wait a moment to ensure everything is processed
      const timer = setTimeout(() => {
        // Clear localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem(`quiz_state_${slug}`)
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [safeState.resultsSaved, safeState.isAuthenticated, slug])

  // Memoize the current question to prevent unnecessary re-renders
  const currentQuestion = React.useMemo(() => {
    return quizQuestions[currentQuestionIndex]
  }, [quizQuestions, currentQuestionIndex])

  const isLastQuestion = currentQuestionIndex === (quizQuestions?.length ?? 0) - 1

  // Handle answer selection
  const handleAnswer = useCallback(
    (selectedOption: string, timeSpent: number, isCorrect: boolean) => {
      try {
        if (isCompleting || !submitQuizAnswer) return

        // Create answer object
        const answer = {
          questionId: currentQuestion?.id || currentQuestionIndex,
          question: currentQuestion?.question,
          selectedOption,
          correctOption: currentQuestion?.answer,
          isCorrect,
          timeSpent,
          index: currentQuestionIndex,
        }

        // Update local state
        const newAnswers = [...answers]
        newAnswers[currentQuestionIndex] = answer
        setAnswers(newAnswers)

        // Submit answer to Redux
        submitQuizAnswer({
          answer: selectedOption,
          userAnswer: selectedOption,
          isCorrect,
          timeSpent,
          questionId: currentQuestion?.id || currentQuestionIndex,
          index: currentQuestionIndex,
        })

        // Move to the next question or complete the quiz
        if (isLastQuestion) {
          handleQuizCompletion(newAnswers)
        } else {
          setCurrentQuestionIndex((prev) => prev + 1)
        }
      } catch (err) {
        console.error("Error handling answer:", err)
        setError(createQuizError(QuizErrorType.UNKNOWN, "Failed to process your answer. Please try again.", err, true))
      }
    },
    [isCompleting, submitQuizAnswer, currentQuestion, currentQuestionIndex, isLastQuestion, answers],
  )

  // Handle quiz completion
  const handleQuizCompletion = useCallback(
    async (finalAnswers: any[]) => {
      if (isCompleting || !completeQuiz) return

      setIsCompleting(true)

      try {
        const answersArray = Array.isArray(finalAnswers) ? finalAnswers : []

        // Calculate score
        const correctAnswers = answersArray.filter((a) => a && a.isCorrect).length
        const totalQuestions = quizQuestions?.length || 0
        const score = quizUtils.calculateScore
          ? quizUtils.calculateScore(
              answersArray.map((a) =>
                a
                  ? {
                      answer: a.selectedOption,
                      isCorrect: a.isCorrect,
                      timeSpent: a.timeSpent,
                    }
                  : { answer: "", isCorrect: false, timeSpent: 0 },
              ),
              "mcq",
            )
          : Math.round((correctAnswers / totalQuestions) * 100)

        // Calculate total time
        const totalTimeSpent = calculateTotalTime(answersArray.filter(Boolean))
        const formattedTimeSpent = formatQuizTime(totalTimeSpent)

        // Prepare result data
        const resultQuizId = quizId || state?.quizId || "test-quiz"
        const quizResult = {
          quizId: resultQuizId,
          slug,
          answers: answersArray,
          score,
          totalQuestions,
          correctAnswers,
          totalTimeSpent,
          formattedTimeSpent,
          completedAt: new Date().toISOString(),
          elapsedTime: Math.floor((Date.now() - startTime) / 1000),
        }

        setQuizResults(quizResult)

        // Complete the quiz in Redux
        await completeQuiz({
          answers: answersArray.map((a) =>
            a
              ? {
                  answer: a.selectedOption,
                  userAnswer: a.selectedOption,
                  isCorrect: a.isCorrect,
                  timeSpent: a.timeSpent,
                  questionId: a.questionId,
                }
              : null,
          ),
          score,
          completedAt: new Date().toISOString(),
        })

        // If the user is authenticated, show results immediately
        if (safeState.isAuthenticated) {
          setShowResults(true)
        }
      } catch (err) {
        console.error("Error completing quiz:", err)
        setError(createQuizError(QuizErrorType.UNKNOWN, "Failed to complete the quiz. Please try again.", err, true))
      } finally {
        setIsCompleting(false)
      }
    },
    [isCompleting, completeQuiz, quizQuestions, slug, startTime, safeState.isAuthenticated, quizId, state?.quizId],
  )

  // Handle continuing as guest
  const handleContinueAsGuest = useCallback(() => {
    setShowResults(true)
  }, [])

  // Handle sign in
  const handleSignIn = useCallback(() => {
    if (handleAuthenticationRequired) {
      // Save current quiz state before redirecting
      saveQuizStateToLocalStorage()

      // Redirect to sign-in
      handleAuthenticationRequired(`/dashboard/mcq/${slug}?fromAuth=true`)
    }
  }, [handleAuthenticationRequired, slug, saveQuizStateToLocalStorage])

  // If there's an error, show the error message
  if (error) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center gap-4">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <h3 className="text-xl font-semibold">Error Loading Quiz</h3>
          <p className="text-muted-foreground">{getUserFriendlyErrorMessage(error)}</p>
          <Button onClick={() => router.push("/dashboard/mcq")}>Return to Quiz List</Button>
        </div>
      </Card>
    )
  }

  // If the quiz is completed and the user is not authenticated, show the guest sign-in prompt
  if (safeState.isCompleted && !safeState.isAuthenticated && !safeState.isProcessingAuth) {
    return (
      <GuestSignInPrompt
        onContinueAsGuest={handleContinueAsGuest}
        onSignIn={handleSignIn}
        quizType="quiz"
        showSaveMessage={true}
      />
    )
  }

  // If the quiz is completed and results are available, show the results
  if ((showResults && quizResults) || (safeState.isCompleted && safeState.isAuthenticated)) {
    return (
      <McqQuizResult
        result={
          quizResults || {
            quizId: quizId || state?.quizId || "test-quiz",
            slug,
            score: safeState.score || 0,
            answers: safeState.answers || [],
            totalQuestions: quizQuestions?.length || 0,
            correctAnswers: (safeState.answers || []).filter((a: any) => a && a.isCorrect).length,
            completedAt: safeState.completedAt || new Date().toISOString(),
          }
        }
      />
    )
  }

  // If there's no current question and we're not showing results, show a loading indicator
  if (!currentQuestion && !showResults) {
    return (
      <Card className="p-6 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p>Loading questions...</p>
      </Card>
    )
  }

  // Otherwise, show the quiz
  return (
    <div className="space-y-6">
      {process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEBUG_MODE === "true" && (
        <Card className="bg-slate-50 border-slate-200">
          <div className="p-3">
            <h3 className="text-sm text-slate-700">Quiz State Debug</h3>
            <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-60 mt-2">
              {JSON.stringify(safeState, null, 2)}
            </pre>
          </div>
        </Card>
      )}

      <McqQuiz
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={quizQuestions?.length || 0}
        isLastQuestion={isLastQuestion}
      />

      {isCompleting && (
        <Card className="p-4 mt-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
            <p>Submitting your answers...</p>
          </div>
        </Card>
      )}
    </div>
  )
}
