"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { memo, useState, useEffect, useCallback, useMemo, useRef } from "react"

import QuizResultsOpenEnded from "./QuizResultsOpenEnded"
import OpenEndedQuizQuestion from "./OpenEndedQuizQuestion"
import NonAuthenticatedUserSignInPrompt from "../../components/NonAuthenticatedUserSignInPrompt"
import {
  ErrorDisplay,
  LoadingDisplay,
  InitializingDisplay,
  QuizNotFoundDisplay,
  EmptyQuestionsDisplay,
} from "@/app/dashboard/components/QuizStateDisplay"
import { useToast } from "@/hooks"
import { calculateTotalTime } from "@/lib/utils/quiz-index"
import { useQuiz } from "@/hooks/useQuizState"

// Session storage key prefix for quiz state
const QUIZ_STATE_STORAGE_KEY = "openended_quiz_state_"

interface OpenEndedQuizContentProps {
  quizData: any
  slug: string
  userId?: string
  quizId: string
}

interface OpenEndedQuizWrapperProps {
  quizData?: any
  slug: string
  userId?: string
  quizId?: string
  isPublic?: boolean
  isFavorite?: boolean
  ownerId?: string
}

// Separate the content component for better memoization
const OpenEndedQuizContent = memo(function OpenEndedQuizContent({
  quizData,
  slug,
  userId,
  quizId,
}: OpenEndedQuizContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const { quizState, isAuthenticated, initialize, submitAnswer, completeQuiz, requireAuthentication, restoreState } =
    useQuiz()

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<string | null>(quizState.error || null)
  const [quizUIState, setQuizUIState] = useState({
    showResults: false,
    showAuthPrompt: false,
    quizResults: null as any,
  })
  const [isRestoringState, setIsRestoringState] = useState(false)

  const startTimeRef = useRef<number>(Date.now())
  const isReset = searchParams.get("reset") === "true"
  const fromAuth = searchParams.get("fromAuth") === "true"

  // Ref to track if we've already attempted restoration
  const hasAttemptedRestoration = useRef(false)

  // Memoize quiz questions to prevent unnecessary re-renders
  const quizQuestions = useMemo(
    () => quizData?.questions || quizState?.questions || [],
    [quizData?.questions, quizState?.questions],
  )

  // Save state to sessionStorage for persistence
  const saveState = useCallback(
    (state: any) => {
      try {
        sessionStorage.setItem(`${QUIZ_STATE_STORAGE_KEY}${slug}`, JSON.stringify(state))
        console.log("State saved to sessionStorage", state)
      } catch (err) {
        console.error("Error saving state to sessionStorage:", err)
      }
    },
    [slug],
  )

  // Load state from sessionStorage
  const loadState = useCallback(() => {
    try {
      const savedState = sessionStorage.getItem(`${QUIZ_STATE_STORAGE_KEY}${slug}`)
      if (savedState) {
        return JSON.parse(savedState)
      }
    } catch (err) {
      console.error("Error loading state from sessionStorage:", err)
    }
    return null
  }, [slug])

  // Initialize quiz only once when data is available
  useEffect(() => {
    if (quizData && !isReset) {
      initialize({
        id: quizData.id || quizId,
        slug,
        title: quizData.title || "Open-Ended Quiz",
        quizType: "openended",
        questions: quizData.questions || [],
        requiresAuth: true,
      })
    }
  }, [initialize, quizData, quizId, slug, isReset])

  // Initialize answers array when questions are available
  useEffect(() => {
    if (quizQuestions.length > 0) {
      setAnswers(Array(quizQuestions.length).fill(null))
    }
  }, [quizQuestions])

  // Create a properly formatted result object for the QuizResultsOpenEnded component
  const createResultObject = useCallback(() => {
    const answersArray = quizState.answers || []
    const totalQuestions = quizQuestions.length || 0
    const totalTimeSpent = calculateTotalTime(answersArray.filter(Boolean))

    return {
      quizId: quizId || quizState?.quizId || "test-quiz",
      slug,
      answers: answersArray,
      questions: quizQuestions,
      totalQuestions,
      totalTimeSpent,
      completedAt: quizState.completedAt || new Date().toISOString(),
      elapsedTime: Math.floor((Date.now() - startTimeRef.current) / 1000),
      startTime: startTimeRef.current,
    }
  }, [quizState.answers, quizState.completedAt, quizState.quizId, quizQuestions, quizId, slug, startTimeRef])

  // Update UI state when quiz is completed
  useEffect(() => {
    if (quizState.isCompleted && !isRestoringState) {
      const results = createResultObject()

      setQuizUIState({
        showResults: isAuthenticated || fromAuth,
        showAuthPrompt: !(isAuthenticated || fromAuth),
        quizResults: results,
      })
    }
  }, [quizState.isCompleted, isAuthenticated, fromAuth, createResultObject, isRestoringState])

  // Update error state when quizState.error changes
  useEffect(() => {
    if (quizState.error) {
      setError(quizState.error)
    }
  }, [quizState.error])

  // Show toast when quiz is completed and authenticated
  useEffect(() => {
    if (quizState.isCompleted && isAuthenticated && !quizState.resultsSaved) {
      toast({
        title: "Quiz completed!",
        description: "Your results have been saved.",
      })
    }
  }, [quizState.isCompleted, quizState.resultsSaved, isAuthenticated, toast])

  // Handle sign in with proper redirect
  const handleSignIn = useCallback(() => {
    const redirectUrl = `/dashboard/openended/${slug}?fromAuth=true`

    // Save current state before redirecting
    if (quizUIState.quizResults) {
      // Create a complete state object to save
      const stateToSave = {
        quizId: quizUIState.quizResults.quizId,
        slug,
        isCompleted: true,
        answers: quizUIState.quizResults.answers,
        questions: quizUIState.quizResults.questions,
        completedAt: quizUIState.quizResults.completedAt,
        totalQuestions: quizUIState.quizResults.totalQuestions,
        totalTimeSpent: quizUIState.quizResults.totalTimeSpent,
      }

      // Save to sessionStorage for restoration after auth
      saveState(stateToSave)
      console.log("Saved state before auth:", stateToSave)
    }

    requireAuthentication?.(redirectUrl)
  }, [requireAuthentication, slug, quizUIState.quizResults, saveState])

  // Restore state after authentication
  useEffect(() => {
    if (fromAuth && isAuthenticated && !hasAttemptedRestoration.current) {
      hasAttemptedRestoration.current = true
      setIsRestoringState(true)
      console.log("Attempting to restore state after authentication")

      // First check if we have savedState in quizState
      if (quizState.savedState) {
        console.log("Restoring state from Redux", quizState.savedState)
        restoreState()

        // After state is restored, update UI
        setTimeout(() => {
          const results = createResultObject()
          setQuizUIState({
            showResults: true,
            showAuthPrompt: false,
            quizResults: results,
          })
          setIsRestoringState(false)
        }, 0)
      } else {
        // Check if we have state in sessionStorage as fallback
        try {
          const savedState = loadState()
          console.log("Loaded state from sessionStorage:", savedState)

          if (savedState && savedState.isCompleted) {
            // Manually set the quiz state as completed
            try {
              console.log("Completing quiz with saved state")
              completeQuiz({
                answers: savedState.answers || [],
                completedAt: savedState.completedAt || new Date().toISOString(),
              })

              setQuizUIState({
                showResults: true,
                showAuthPrompt: false,
                quizResults: savedState,
              })
              setIsRestoringState(false)

            } catch (err) {
              console.error("Error completing quiz:", err)
              setError("Failed to restore quiz state. Please try again.")
              setIsRestoringState(false)
            }
          } else {
            console.log("No completed state found in sessionStorage")
            setIsRestoringState(false)
          }
        } catch (err) {
          console.error("Error restoring state:", err)
          setIsRestoringState(false)
        }
      }

      // Clean up URL params
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        url.searchParams.delete("fromAuth")
        window.history.replaceState({}, "", url.toString())
      }
    }
  }, [isAuthenticated, quizState.savedState, restoreState, fromAuth, createResultObject, slug, completeQuiz, loadState])

  // Memoize current question and last question status
  const currentQuestion = useMemo(() => quizQuestions[currentQuestionIndex], [quizQuestions, currentQuestionIndex])
  const isLastQuestion = useMemo(
    () => currentQuestionIndex === quizQuestions.length - 1,
    [currentQuestionIndex, quizQuestions.length],
  )

  // Update the handleQuizCompletion function to ensure results are properly saved and displayed
  const handleQuizCompletion = useCallback(
    async (finalAnswers: any[]) => {
      if (isCompleting) return

      setIsCompleting(true)

      try {
        const answersArray = Array.isArray(finalAnswers) ? finalAnswers : []
        const totalQuestions = quizQuestions.length || 1

        const totalTimeSpent = calculateTotalTime(answersArray.filter(Boolean))
        const completedAt = new Date().toISOString()
        const elapsedTime = Math.floor((Date.now() - startTimeRef.current) / 1000)

        const result = {
          quizId: quizId || quizState?.quizId || "test-quiz",
          slug,
          answers: answersArray,
          questions: quizQuestions,
          totalQuestions,
          totalTimeSpent,
          completedAt,
          elapsedTime,
          startTime: startTimeRef.current,
        }

        // Save state to sessionStorage for persistence
        saveState(result)

        setQuizUIState({
          showResults: isAuthenticated,
          showAuthPrompt: !isAuthenticated,
          quizResults: result,
        })

        // Complete quiz in state management
        try {
          await completeQuiz({
            answers: answersArray,
            completedAt,
          })
        } catch (err) {
          console.error("Error completing quiz:", err)
          setError("Failed to complete the quiz. Please try again.")
          toast({
            title: "Error",
            description: "Failed to complete the quiz.",
            variant: "destructive",
          })
        }
      } catch (err) {
        console.error("Error completing quiz:", err)
        setError("Failed to complete the quiz. Please try again.")
        toast({
          title: "Error",
          description: "Failed to complete the quiz.",
          variant: "destructive",
        })
      } finally {
        setIsCompleting(false)
      }
    },
    [
      isCompleting,
      quizQuestions,
      startTimeRef,
      slug,
      isAuthenticated,
      quizId,
      quizState?.quizId,
      toast,
      completeQuiz,
      saveState,
    ],
  )

  // Handle answer submission
  const handleAnswer = useCallback(
    (userAnswer: string) => {
      if (isCompleting || !currentQuestion) return

      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000)
      startTimeRef.current = Date.now() // Reset timer for next question

      const hintsUsed = false // For open-ended questions, we don't track this the same way

      const answer = {
        questionId: currentQuestion?.id || currentQuestionIndex.toString(),
        question: currentQuestion?.question,
        answer: userAnswer,
        userAnswer: userAnswer,
        timeSpent,
        hintsUsed,
        index: currentQuestionIndex,
      }

      // Update answers array
      setAnswers((prev) => {
        const newAnswers = [...prev]
        newAnswers[currentQuestionIndex] = answer
        return newAnswers
      })

      // Submit answer to state management
      submitAnswer(answer)

      // Handle last question or move to next
      if (isLastQuestion) {
        const finalAnswers = [...answers.slice(0, currentQuestionIndex), answer]
        handleQuizCompletion(finalAnswers)
      } else {
        setCurrentQuestionIndex((prev) => prev + 1)
      }
    },
    [
      isCompleting,
      currentQuestion,
      currentQuestionIndex,
      isLastQuestion,
      answers,
      submitAnswer,
      handleQuizCompletion,
      startTimeRef,
    ],
  )

  // Render appropriate UI based on state
  if (error) {
    return (
      <ErrorDisplay
        data-testid="error-display"
        error={error}
        onRetry={() => window.location.reload()}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  if (quizUIState.showAuthPrompt) {
    return (
      <NonAuthenticatedUserSignInPrompt
        data-testid="guest-sign-in-prompt"
        onSignIn={handleSignIn}
        quizType="open-ended quiz"
        showSaveMessage
      />
    )
  }

  if (quizUIState.showResults) {
    console.log("Showing quiz results:", quizUIState.quizResults)
    return (
      <div data-testid="quiz-results-container">
        <QuizResultsOpenEnded data-testid="quiz-results" result={quizUIState.quizResults} />
      </div>
    )
  }

  if (!currentQuestion) {
    return <LoadingDisplay data-testid="loading-display" />
  }

  return (
    <div className="space-y-6">
      {process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEBUG_MODE === "true" && (
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-md">
          <h3 className="text-sm text-slate-700">Quiz State Debug</h3>
          <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-60 mt-2">
            {JSON.stringify(quizState, null, 2)}
          </pre>
        </div>
      )}

      <OpenEndedQuizQuestion
        data-testid="openended-quiz"
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={quizQuestions.length}
        isLastQuestion={isLastQuestion}
      />

      {isCompleting && (
        <div className="p-4 mt-4 border rounded-md">
          <div className="flex items-center justify-center">
            <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
            <p>Submitting your answers...</p>
          </div>
        </div>
      )}
    </div>
  )
})

// Main wrapper component with proper initialization handling
export default function OpenEndedQuizWrapper({
  quizData,
  slug,
  userId,
  quizId,
  isPublic,
  isFavorite,
  ownerId,
}: OpenEndedQuizWrapperProps) {
  const [isInitializing, setIsInitializing] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isReset = searchParams.get("reset") === "true"
  const fromAuth = searchParams.get("fromAuth") === "true"
  const { quizState, isAuthenticated } = useQuiz()

  // Skip initialization delay in test environment
  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      setIsInitializing(false)
      return
    }

    const timer = setTimeout(() => setIsInitializing(false), 500)
    return () => clearTimeout(timer)
  }, [isReset])

  // Check for saved state in sessionStorage on initial load
  useEffect(() => {
    if (fromAuth && isAuthenticated && !quizState.savedState) {
      try {
        const savedStateString = sessionStorage.getItem(`${QUIZ_STATE_STORAGE_KEY}${slug}`)
        if (savedStateString) {
          // We have state in sessionStorage, but we'll let the OpenEndedQuizContent handle it
          console.log("Found saved state in sessionStorage")
        }
      } catch (err) {
        console.error("Error checking sessionStorage for saved state:", err)
      }
    }
  }, [fromAuth, isAuthenticated, quizState.savedState, slug])

  // Render appropriate UI based on initialization state
  if (isInitializing) {
    return <InitializingDisplay data-testid="initializing-display" />
  }

  if (!slug) {
    return <QuizNotFoundDisplay data-testid="not-found-display" onReturn={() => router.push("/dashboard/quizzes")} />
  }

  if (!quizData?.questions || quizData.questions.length === 0) {
    return (
      <EmptyQuestionsDisplay data-testid="empty-questions-display" onReturn={() => router.push("/dashboard/quizzes")} />
    )
  }

  return <OpenEndedQuizContent quizData={quizData} slug={slug} userId={userId} quizId={quizId} />
}
