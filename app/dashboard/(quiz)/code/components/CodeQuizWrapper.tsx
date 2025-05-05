"use client"

import { useRouter } from "next/navigation"
import { memo, useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"

import CodeQuizResult from "./CodeQuizResult"
import CodingQuiz from "./CodingQuiz"
import GuestSignInPrompt from "../../components/GuestSignInPrompt"
import { useQuizState } from "@/hooks/useQuizState"
import {
  ErrorDisplay,
  LoadingDisplay,
  InitializingDisplay,
  QuizNotFoundDisplay,
  EmptyQuestionsDisplay,
} from "@/app/dashboard/components/QuizStateDisplay"
import type { CodeQuizContentProps, CodeQuizWrapperProps } from "@/app/types/code-quiz-types"
import { useToast } from "@/hooks"

// Memoize the content component to prevent unnecessary re-renders
export const CodeQuizContent = memo(function CodeQuizContent({ quizData, slug, userId, quizId }: CodeQuizContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [isCompleting, setIsCompleting] = useState(false)
  const { toast } = useToast()

  // Use the quiz state hook for state management
  const {
    state,
    isAuthenticated,
    isLastQuestion,
    currentQuestion,
    initializeQuiz,
    submitAnswer,
    completeQuiz,
    restartQuiz,
    handleAuthenticationRequired,
    saveQuizStateToStorage,
    restoreQuizStateFromStorage,
  } = useQuizState()

  // Get questions from props or context
  const quizQuestions = quizData?.questions || state?.questions || []

  // Check if user is authenticated
  const isUserAuthenticated = status === "authenticated" && !!session?.user

  // Initialize quiz on component mount
  useEffect(() => {
    // Try to restore state from storage if returning from auth
    if (typeof window !== "undefined") {
      const fromAuth = searchParams?.get("fromAuth") === "true"

      if (fromAuth && isUserAuthenticated) {
        // Restore quiz state
        restoreQuizStateFromStorage(slug)

        // Clear URL parameter
        const newUrl = window.location.pathname
        window.history.replaceState({}, document.title, newUrl)
      } else {
        // Initialize the quiz with the provided data
        initializeQuiz({
          id: quizId,
          slug,
          questions: quizQuestions,
          quizType: "code",
          requiresAuth: true,
          isAuthenticated: isUserAuthenticated,
          title: quizData?.title || "Code Quiz",
        })
      }
    }
  }, [
    initializeQuiz,
    quizId,
    slug,
    quizQuestions,
    isUserAuthenticated,
    searchParams,
    restoreQuizStateFromStorage,
    quizData,
  ])

  // Get current question
  const currentQuestionData = quizQuestions[state.currentQuestionIndex]

  // Handle answer selection
  const handleAnswer = useCallback(
    (selectedAnswer: string, timeSpent: number, isCorrect: boolean) => {
      try {
        if (isCompleting) return

        // Submit answer to Redux
        submitAnswer(selectedAnswer, timeSpent, isCorrect, {
          questionId: currentQuestionData?.id || state.currentQuestionIndex,
          question: currentQuestionData?.question,
          codeSnippet: selectedAnswer,
          language: currentQuestionData?.language || "javascript",
        })

        // If last question, complete quiz
        if (isLastQuestion) {
          handleQuizCompletion()
        }
      } catch (err) {
        console.error("Error handling answer:", err)
      }
    },
    [isCompleting, submitAnswer, currentQuestionData, state.currentQuestionIndex, isLastQuestion],
  )

  // Handle quiz completion
  const handleQuizCompletion = useCallback(async () => {
    if (isCompleting) return

    setIsCompleting(true)

    try {
      // Complete quiz in Redux
      await completeQuiz()

      // Save state to storage
      saveQuizStateToStorage()

      // Show success toast
      toast({
        title: "Quiz completed!",
        description: "Your results have been saved.",
      })
    } catch (err) {
      console.error("Error completing quiz:", err)

      // Show error toast
      toast({
        title: "Error",
        description: "Failed to complete quiz. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCompleting(false)
    }
  }, [isCompleting, completeQuiz, saveQuizStateToStorage, toast])

  // Handle continuing as guest
  const handleContinueAsGuest = useCallback(() => {
    // Just show the results without authentication
  }, [])

  // Handle sign in
  const handleSignIn = useCallback(() => {
    // Save quiz state before redirecting
    saveQuizStateToStorage()

    // Create the redirect URL
    const redirectUrl = `/dashboard/code/${slug}?fromAuth=true`

    // Call the authentication handler
    handleAuthenticationRequired(redirectUrl)
  }, [slug, handleAuthenticationRequired, saveQuizStateToStorage])

  // If there's an error in the state, show the error message
  if (state.error) {
    return (
      <ErrorDisplay
        error={state.error}
        onRetry={() => window.location.reload()}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  // If the quiz is completed and the user is not authenticated, show the guest sign-in prompt
  if (state.isCompleted && !isUserAuthenticated) {
    return (
      <GuestSignInPrompt
        onContinueAsGuest={handleContinueAsGuest}
        onSignIn={handleSignIn}
        quizType="code"
        showSaveMessage={true}
      />
    )
  }

  // If the quiz is completed and results are available, show the results
  if (state.isCompleted || state.forceShowResults) {
    return (
      <CodeQuizResult
        title={quizData?.title || "Code Quiz"}
        onRestart={() => window.location.reload()}
        quizId={quizId}
        questions={quizQuestions}
        answers={state.answers || []}
        score={state.score || 0}
        isGuestMode={!isUserAuthenticated}
      />
    )
  }

  // If there's no current question and we're not showing results, show a loading indicator
  if (!currentQuestionData && !state.isCompleted) {
    return <LoadingDisplay />
  }

  // Otherwise, show the quiz
  return (
    <div className="space-y-6">
      {process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEBUG_MODE === "true" && (
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-md">
          <h3 className="text-sm text-slate-700">Quiz State Debug</h3>
          <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-60 mt-2">
            {JSON.stringify(state, null, 2)}
          </pre>
        </div>
      )}

      <CodingQuiz
        question={currentQuestionData}
        onAnswer={handleAnswer}
        questionNumber={state.currentQuestionIndex + 1}
        totalQuestions={quizQuestions?.length || 0}
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
  const hasInitialized = useRef(false)

  // Validate quiz data and slug
  const validQuizId = quizId || ""
  const validSlug = slug && slug !== "unknown" ? slug : ""

  // Skip initialization delay in test environment
  useEffect(() => {
    // Prevent double initialization
    if (hasInitialized.current) return
    hasInitialized.current = true

    // Skip delay in test environment
    if (process.env.NODE_ENV === "test") {
      setIsInitializing(false)
      return
    }

    // Short delay to allow state to initialize
    const timer = setTimeout(() => {
      setIsInitializing(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Show loading state during initialization
  if (isInitializing) {
    return <InitializingDisplay />
  }

  // Error state if quiz data is invalid
  if (!validQuizId || !validSlug) {
    return <QuizNotFoundDisplay onReturn={() => router.push("/dashboard/quizzes")} />
  }

  // Early return for empty questions
  if (!quizData?.questions || quizData.questions.length === 0) {
    return <EmptyQuestionsDisplay onReturn={() => router.push("/dashboard/quizzes")} />
  }

  return <CodeQuizContent quizData={quizData} slug={validSlug} userId={userId} quizId={validQuizId} />
}
