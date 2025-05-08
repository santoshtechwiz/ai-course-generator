"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { memo, useState, useEffect, useCallback, useMemo } from "react"

import CodeQuizResult from "./CodeQuizResult"
import CodingQuiz from "./CodingQuiz"
import NonAuthenticatedUserSignInPrompt from "../../components/NonAuthenticatedUserSignInPrompt"
import {
  ErrorDisplay,
  LoadingDisplay,
  InitializingDisplay,
  QuizNotFoundDisplay,
  EmptyQuestionsDisplay,
} from "@/app/dashboard/components/QuizStateDisplay"
import type { CodeQuizContentProps, CodeQuizWrapperProps } from "@/app/types/code-quiz-types"
import { useToast } from "@/hooks"
import { calculateTotalTime } from "@/lib/utils/quiz-index"
import { quizUtils } from "@/lib/utils/quiz-utils"
import { useQuiz } from "@/hooks/useQuizState"

// Local storage key prefix for quiz state
const QUIZ_STATE_STORAGE_KEY = "quiz_state_"

// Separate the content component for better memoization
const CodeQuizContent = memo(function CodeQuizContent({ quizData, slug, userId, quizId }: CodeQuizContentProps) {
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
  const [startTime] = useState<number>(Date.now())
  const [isRestoringState, setIsRestoringState] = useState(false)

  // Memoize quiz questions to prevent unnecessary re-renders
  const quizQuestions = useMemo(
    () => quizData?.questions || quizState?.questions || [],
    [quizData?.questions, quizState?.questions],
  )

  const isReset = searchParams.get("reset") === "true"
  const fromAuth = searchParams.get("fromAuth") === "true"

  // Save state to localStorage for persistence
  const saveState = useCallback(
    (state: any) => {
      try {
        localStorage.setItem(`${QUIZ_STATE_STORAGE_KEY}${slug}`, JSON.stringify(state))
        console.log("State saved to localStorage", state)
      } catch (err) {
        console.error("Error saving state to localStorage:", err)
      }
    },
    [slug],
  )

  // Load state from localStorage
  const loadState = useCallback(() => {
    try {
      const savedState = localStorage.getItem(`${QUIZ_STATE_STORAGE_KEY}${slug}`)
      if (savedState) {
        return JSON.parse(savedState)
      }
    } catch (err) {
      console.error("Error loading state from localStorage:", err)
    }
    return null
  }, [slug])

  // Initialize quiz only once when data is available
  useEffect(() => {
    if (quizData && !isReset) {
      initialize({
        id: quizData.id || quizId,
        slug,
        title: quizData.title || "Code Quiz",
        quizType: "code",
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

  // Create a properly formatted result object for the CodeQuizResult component
  const createResultObject = useCallback(() => {
    const answersArray = quizState.answers || []
    const correctAnswers = answersArray.filter((a: any) => a?.isCorrect).length
    const totalQuestions = quizQuestions.length || 0
    const totalTimeSpent = calculateTotalTime(answersArray.filter(Boolean))

    return {
      quizId: quizId || quizState?.quizId || "test-quiz",
      slug,
      answers: answersArray,
      score: quizState.score || 0,
      totalQuestions,
      correctAnswers,
      totalTimeSpent,
      completedAt: quizState.completedAt || new Date().toISOString(),
      elapsedTime: Math.floor((Date.now() - startTime) / 1000),
    }
  }, [
    quizState.answers,
    quizState.score,
    quizState.completedAt,
    quizState.quizId,
    quizQuestions.length,
    quizId,
    slug,
    startTime,
  ])

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

  // Restore state after authentication
  useEffect(() => {
    if (fromAuth && isAuthenticated) {
      setIsRestoringState(true)

      // First check if we have savedState in quizState
      if (quizState.savedState) {
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
        // Check if we have state in localStorage as fallback
        const savedState = loadState()
        if (savedState && savedState.isCompleted) {
          setQuizUIState({
            showResults: true,
            showAuthPrompt: false,
            quizResults: savedState,
          })
        }
        setIsRestoringState(false)
      }

      // Clean up URL params
      const url = new URL(window.location.href)
      url.searchParams.delete("fromAuth")
      window.history.replaceState({}, "", url.toString())
    }
  }, [isAuthenticated, quizState.savedState, restoreState, fromAuth, createResultObject, loadState])

  // Memoize current question and last question status
  const currentQuestion = useMemo(() => quizQuestions[currentQuestionIndex], [quizQuestions, currentQuestionIndex])

  const isLastQuestion = useMemo(
    () => currentQuestionIndex === quizQuestions.length - 1,
    [currentQuestionIndex, quizQuestions.length],
  )

  // Handle quiz completion with proper cleanup
  const handleQuizCompletion = useCallback(
    async (finalAnswers: any[]) => {
      if (isCompleting) return

      setIsCompleting(true)

      try {
        const answersArray = Array.isArray(finalAnswers) ? finalAnswers : []
        const correctAnswers = answersArray.filter((a) => a?.isCorrect).length
        const totalQuestions = quizQuestions.length || 1

        // Calculate score using utility or fallback to percentage
        const score = quizUtils.calculateScore
          ? quizUtils.calculateScore(
              answersArray.map((a) => a || { answer: "", isCorrect: false, timeSpent: 0 }),
              "code",
            )
          : Math.round((correctAnswers / totalQuestions) * 100)

        const totalTimeSpent = calculateTotalTime(answersArray.filter(Boolean))
        const completedAt = new Date().toISOString()
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000)

        const result = {
          quizId: quizId || quizState?.quizId || "test-quiz",
          slug,
          answers: answersArray,
          score,
          totalQuestions,
          correctAnswers,
          totalTimeSpent,
          completedAt,
          elapsedTime,
        }

        // Save state to localStorage for persistence
        saveState(result)

        setQuizUIState({
          showResults: isAuthenticated,
          showAuthPrompt: !isAuthenticated,
          quizResults: result,
        })

        // Complete quiz in state management
        await completeQuiz({
          answers: answersArray.map((a) => a || null),
          score,
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
      } finally {
        setIsCompleting(false)
      }
    },
    [
      isCompleting,
      quizQuestions.length,
      startTime,
      slug,
      isAuthenticated,
      quizId,
      quizState?.quizId,
      toast,
      completeQuiz,
      saveState,
    ],
  )

  // Handle answer submission with proper validation
  const handleAnswer = useCallback(
    (selectedAnswer: string, timeSpent: number, isCorrect: boolean) => {
      if (isCompleting) return

      const answer = {
        questionId: currentQuestion?.id || currentQuestionIndex.toString(),
        question: currentQuestion?.question,
        answer: selectedAnswer,
        userAnswer: selectedAnswer,
        isCorrect,
        timeSpent,
        index: currentQuestionIndex,
        codeSnippet: selectedAnswer,
        language: currentQuestion?.language || "javascript",
      }

      setAnswers((prev) => {
        const newAnswers = [...prev]
        newAnswers[currentQuestionIndex] = answer
        return newAnswers
      })

      submitAnswer(answer)

      if (isLastQuestion) {
        const finalAnswers = [...answers.slice(0, currentQuestionIndex), answer]
        handleQuizCompletion(finalAnswers)
      } else {
        setCurrentQuestionIndex((prev) => prev + 1)
      }
    },
    [isCompleting, currentQuestion, currentQuestionIndex, isLastQuestion, answers, submitAnswer, handleQuizCompletion],
  )

  // Handle sign in with proper redirect
  const handleSignIn = useCallback(() => {
    const redirectUrl = `/dashboard/code/${slug}?fromAuth=true`

    // Save current state before redirecting
    if (quizUIState.quizResults) {
      saveState({
        quizId: quizUIState.quizResults.quizId,
        slug,
        isCompleted: true,
        score: quizUIState.quizResults.score,
        answers: quizUIState.quizResults.answers,
        completedAt: quizUIState.quizResults.completedAt,
      })
    }

    requireAuthentication?.(redirectUrl)
  }, [requireAuthentication, slug, quizUIState.quizResults, saveState])

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
        quizType="code quiz"
        showSaveMessage
      />
    )
  }

  if (quizUIState.showResults) {
    return <CodeQuizResult data-testid="quiz-results" result={quizUIState.quizResults} />
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

      <CodingQuiz
        data-testid="coding-quiz"
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
export default function CodeQuizWrapper({
  quizData,
  slug,
  userId,
  quizId,
  isPublic,
  isFavorite,
  ownerId,
}: CodeQuizWrapperProps) {
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

  // Check for saved state in localStorage on initial load
  useEffect(() => {
    if (fromAuth && isAuthenticated && !quizState.savedState) {
      try {
        const savedStateString = localStorage.getItem(`${QUIZ_STATE_STORAGE_KEY}${slug}`)
        if (savedStateString) {
          // We have state in localStorage, but we'll let the CodeQuizContent handle it
          console.log("Found saved state in localStorage")
        }
      } catch (err) {
        console.error("Error checking localStorage for saved state:", err)
      }
    }
  }, [fromAuth, isAuthenticated, quizState.savedState, slug])

  // Render appropriate UI based on initialization state
  if (isInitializing) {
    return <InitializingDisplay data-testid="initializing-display" />
  }

  if (!quizId || !slug) {
    return <QuizNotFoundDisplay data-testid="not-found-display" onReturn={() => router.push("/dashboard/quizzes")} />
  }

  if (!quizData?.questions || quizData.questions.length === 0) {
    return (
      <EmptyQuestionsDisplay data-testid="empty-questions-display" onReturn={() => router.push("/dashboard/quizzes")} />
    )
  }

  return <CodeQuizContent quizData={quizData} slug={slug} userId={userId} quizId={quizId} />
}
