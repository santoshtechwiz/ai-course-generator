"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { memo, useState, useEffect, useCallback, useMemo, useRef } from "react"

import BlanksQuiz from "./BlanksQuiz"
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
import { quizUtils } from "@/lib/utils/quiz-utils"
import { useQuiz } from "@/hooks/useQuizState"
import type { BlanksQuizContentProps, BlanksQuizWrapperProps } from "../blanks-quiz-types"
import BlanksQuizResult from "./BlankQuizResults"

// Session storage key prefix for quiz state
const QUIZ_STATE_STORAGE_KEY = "blanks_quiz_state_"

// Separate the content component for better memoization
const BlanksQuizContent = memo(function BlanksQuizContent({ quizData, slug, userId, quizId }: BlanksQuizContentProps) {
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
        title: quizData.title || "Blanks Quiz",
        quizType: "blanks",
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

  // Create a properly formatted result object for the BlanksQuizResult component
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
      elapsedTime: Math.floor((Date.now() - startTimeRef.current) / 1000),
    }
  }, [
    quizState.answers,
    quizState.score,
    quizState.completedAt,
    quizState.quizId,
    quizQuestions.length,
    quizId,
    slug,
    startTimeRef,
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

  // Handle sign in with proper redirect
  const handleSignIn = useCallback(() => {
    const redirectUrl = `/dashboard/blanks/${slug}?fromAuth=true`

    // Save current state before redirecting
    if (quizUIState.quizResults) {
      // Save to sessionStorage for restoration after auth
      const stateToSave = {
        quizId: quizUIState.quizResults.quizId,
        slug,
        isCompleted: true,
        score: quizUIState.quizResults.score,
        answers: quizUIState.quizResults.answers,
        completedAt: quizUIState.quizResults.completedAt,
      }

      saveState(stateToSave)
    }

    requireAuthentication?.(redirectUrl)
  }, [requireAuthentication, slug, quizUIState.quizResults, saveState])

  // Restore state after authentication
  useEffect(() => {
    if (fromAuth && isAuthenticated && !hasAttemptedRestoration.current) {
      hasAttemptedRestoration.current = true
      setIsRestoringState(true)

      // First check if we have savedState in quizState
      if (quizState.savedState) {
        restoreState()

        // After state is restored, update UI
        setTimeout(() => {
          setQuizUIState({
            showResults: true,
            showAuthPrompt: false,
            quizResults: createResultObject(),
          })
          setIsRestoringState(false)
        }, 0)
      } else {
        // Check if we have state in sessionStorage as fallback
        try {
          const savedStateString = sessionStorage.getItem(`${QUIZ_STATE_STORAGE_KEY}${slug}`)
          if (savedStateString) {
            const savedState = JSON.parse(savedStateString)
            if (savedState && savedState.isCompleted) {
              // Manually set the quiz state as completed
              try {
                const completeQuizResult = completeQuiz({
                  answers: savedState.answers || [],
                  score: savedState.score || 0,
                  completedAt: savedState.completedAt || new Date().toISOString(),
                })

                // Handle both Promise and non-Promise return types
                if (completeQuizResult && typeof completeQuizResult.then === "function") {
                  completeQuizResult
                    .then(() => {
                      setQuizUIState({
                        showResults: true,
                        showAuthPrompt: false,
                        quizResults: savedState,
                      })
                    })
                    .catch((err) => {
                      console.error("Error completing quiz:", err)
                      setError("Failed to restore quiz state. Please try again.")
                    })
                } else {
                  // If not a Promise, update UI immediately
                  setQuizUIState({
                    showResults: true,
                    showAuthPrompt: false,
                    quizResults: savedState,
                  })
                }
              } catch (err) {
                console.error("Error completing quiz:", err)
                setError("Failed to restore quiz state. Please try again.")
              }
            }
          }
          setIsRestoringState(false)
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
  }, [isAuthenticated, quizState.savedState, restoreState, fromAuth, createResultObject, slug, completeQuiz])

  // Memoize current question and last question status
  const currentQuestion = useMemo(() => quizQuestions[currentQuestionIndex], [quizQuestions, currentQuestionIndex])
  const isLastQuestion = useMemo(
    () => currentQuestionIndex === quizQuestions.length - 1,
    [currentQuestionIndex, quizQuestions.length],
  )

  // Extract the correct answer from the question text
  const extractCorrectAnswer = useCallback((questionText: string) => {
    const match = questionText.match(/\[\[(.*?)\]\]/)
    return match ? match[1] : ""
  }, [])

  // Function to calculate the similarity between two strings
  const calculateSimilarity = useCallback((str1: string, str2: string) => {
    str1 = str1.toLowerCase()
    str2 = str2.toLowerCase()

    const maxLength = Math.max(str1.length, str2.length)
    if (maxLength === 0) {
      return 100 // Both strings are empty, consider them identical
    }

    let edits = 0
    for (let i = 0; i < maxLength; i++) {
      if (str1[i] !== str2[i]) {
        edits++
      }
    }

    const similarity = ((maxLength - edits) / maxLength) * 100
    return similarity
  }, [])

  // Update the handleQuizCompletion function to ensure results are properly saved and displayed
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
              "blanks",
            )
          : Math.round((correctAnswers / totalQuestions) * 100)

        const totalTimeSpent = calculateTotalTime(answersArray.filter(Boolean))
        const completedAt = new Date().toISOString()
        const elapsedTime = Math.floor((Date.now() - startTimeRef.current) / 1000)

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
      quizQuestions.length,
      startTimeRef,
      slug,
      isAuthenticated,
      quizId,
      quizState?.quizId,
      toast,
      completeQuiz,
      saveState,
      calculateSimilarity,
    ],
  )

  // Update the handleAnswer function to ensure correct answer extraction and similarity calculation
  const handleAnswer = useCallback(
    (userAnswer: string, timeSpent: number, hintsUsed = false) => {
      if (isCompleting || !currentQuestion) return

      const correctAnswer = extractCorrectAnswer(currentQuestion.question)
      const similarity = calculateSimilarity(userAnswer, correctAnswer)
      const isCorrect = similarity >= 80 // Consider correct if similarity is at least 80%

      const answer = {
        questionId: currentQuestion?.id || currentQuestionIndex.toString(),
        question: currentQuestion?.question,
        answer: userAnswer,
        userAnswer: userAnswer,
        correctAnswer: correctAnswer,
        isCorrect,
        timeSpent,
        similarity,
        hintsUsed,
        index: currentQuestionIndex,
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
    [
      isCompleting,
      currentQuestion,
      currentQuestionIndex,
      isLastQuestion,
      answers,
      submitAnswer,
      handleQuizCompletion,
      extractCorrectAnswer,
      calculateSimilarity,
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
        quizType="blanks quiz"
        showSaveMessage
      />
    )
  }

  if (quizUIState.showResults) {
    return <BlanksQuizResult data-testid="quiz-results" result={quizUIState.quizResults} />
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

      <BlanksQuiz
        data-testid="blanks-quiz"
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
export default function BlanksQuizWrapper({
  quizData,
  slug,
  userId,
  quizId,
  isPublic,
  isFavorite,
  ownerId,
}: BlanksQuizWrapperProps) {
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
          // We have state in sessionStorage, but we'll let the BlanksQuizContent handle it
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

  return <BlanksQuizContent quizData={quizData} slug={slug} userId={userId} quizId={quizId} />
}
