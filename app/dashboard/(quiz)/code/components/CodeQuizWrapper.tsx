"use client"

import { useRouter } from "next/navigation"
import { memo, useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"

import CodeQuizResult from "./CodeQuizResult"
import CodingQuiz from "./CodingQuiz"
import GuestSignInPrompt from "../../components/GuestSignInPrompt"
import { useQuiz } from "@/app/context/QuizContext"
import {
  ErrorDisplay,
  LoadingDisplay,
  InitializingDisplay,
  QuizNotFoundDisplay,
  EmptyQuestionsDisplay,
} from "@/app/dashboard/components/QuizStateDisplay"
import type { CodeQuizContentProps, CodeQuizWrapperProps } from "@/app/types/code-quiz-types"
import { useToast } from "@/hooks"
import { quizUtils, formatQuizTime, calculateTotalTime } from "@/lib/utils/quiz-index"

// Memoize the content component to prevent unnecessary re-renders
export const CodeQuizContent = memo(function CodeQuizContent({ quizData, slug, userId, quizId }: CodeQuizContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [isCompleting, setIsCompleting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [quizResults, setQuizResults] = useState<any>(null)
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

  // Get questions from props or context
  const quizQuestions = quizData?.questions || contextState?.questions || []

  // Initialize answers array on component mount
  useEffect(() => {
    if (quizQuestions && Array.isArray(quizQuestions) && quizQuestions.length > 0) {
      setAnswers(Array(quizQuestions.length).fill(null))
    }
  }, [quizQuestions])

  // Check if we should show results when state changes
  useEffect(() => {
    if (contextState.isCompleted && contextState.isAuthenticated) {
      setShowResults(true)
    }
  }, [contextState])

  // Check for URL parameters that indicate returning from auth
  useEffect(() => {
    const fromAuth = searchParams.get("fromAuth")

    if (fromAuth === "true") {
      // Always set showResults to true when returning from auth
      setShowResults(true)

      // Call setAuthCheckComplete if available
      if (typeof setAuthCheckComplete === "function") {
        setAuthCheckComplete(true)
      }
    }
  }, [searchParams, setAuthCheckComplete])

  // Handle result saving notification
  useEffect(() => {
    if (contextState.isCompleted && contextState.isAuthenticated && !contextState.resultsSaved) {
      toast({
        title: "Quiz completed!",
        description: "Your results have been saved.",
      })
    }
  }, [contextState, toast])

  // Add this after the useEffect hooks
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("CodeQuizWrapper state:", {
        showResults,
        isCompleted: contextState.isCompleted,
        isAuthenticated: contextState.isAuthenticated,
        pendingAuthRequired: contextState.pendingAuthRequired,
        fromAuth: searchParams.get("fromAuth"),
      })
    }
  }, [contextState, searchParams, showResults])

  // Get current question
  const currentQuestion = quizQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quizQuestions.length - 1

  // Handle answer selection
  const handleAnswer = useCallback(
    (selectedAnswer: string, timeSpent: number, isCorrect: boolean) => {
      try {
        if (isCompleting || !submitQuizAnswer) return

        // Create answer object
        const answer = {
          questionId: currentQuestion?.id || currentQuestionIndex,
          question: currentQuestion?.question,
          answer: selectedAnswer,
          userAnswer: selectedAnswer,
          isCorrect,
          timeSpent,
          index: currentQuestionIndex,
          codeSnippet: selectedAnswer,
          language: currentQuestion?.language || "javascript",
        }

        // Update local state
        const newAnswers = [...answers]
        newAnswers[currentQuestionIndex] = answer
        setAnswers(newAnswers)

        // Submit answer to Redux
        submitQuizAnswer({
          answer: selectedAnswer,
          userAnswer: selectedAnswer,
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
                      answer: a.answer,
                      isCorrect: a.isCorrect,
                      timeSpent: a.timeSpent,
                    }
                  : { answer: "", isCorrect: false, timeSpent: 0 },
              ),
              "code",
            )
          : Math.round((correctAnswers / totalQuestions) * 100)

        // Calculate total time
        const totalTimeSpent = calculateTotalTime(answersArray.filter(Boolean))
        const formattedTimeSpent = formatQuizTime(totalTimeSpent)

        // Prepare result data
        const resultQuizId = quizId || contextState?.quizId || "test-quiz"
        const quizResult = {
          quizId: resultQuizId,
          slug,
          answers: answersArray,
          score,
          totalQuestions,
          correctAnswers,
          totalTimeSpent,
          completedAt: new Date().toISOString(),
          elapsedTime: Math.floor((Date.now() - startTime) / 1000),
        }

        setQuizResults(quizResult)

        // Complete the quiz in Redux
        await completeQuiz({
          answers: answersArray.map((a) =>
            a
              ? {
                  answer: a.answer,
                  userAnswer: a.userAnswer,
                  isCorrect: a.isCorrect,
                  timeSpent: a.timeSpent,
                  questionId: a.questionId,
                  codeSnippet: a.codeSnippet,
                  language: a.language,
                }
              : null,
          ),
          score,
          completedAt: new Date().toISOString(),
        })

        // If the user is authenticated, show results immediately
        if (contextState.isAuthenticated) {
          setShowResults(true)
        }
      } catch (err) {
        console.error("Error completing quiz:", err)
      } finally {
        setIsCompleting(false)
      }
    },
    [
      isCompleting,
      completeQuiz,
      quizQuestions,
      slug,
      startTime,
      contextState.isAuthenticated,
      quizId,
      contextState?.quizId,
    ],
  )

  // Handle continuing as guest
  const handleContinueAsGuest = useCallback(() => {
    setShowResults(true)
  }, [])

  // Handle sign in
  const handleSignIn = useCallback(() => {
    if (handleAuthenticationRequired) {
      // Redirect to sign-in
      handleAuthenticationRequired(`/dashboard/code/${slug}?fromAuth=true`)
    }
  }, [handleAuthenticationRequired, slug])

  // If there's an error in the context, show the error message
  if (contextState.error) {
    return (
      <ErrorDisplay
        error={contextState.error}
        onRetry={() => window.location.reload()}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  // If the quiz is completed and the user is not authenticated, show the guest sign-in prompt
  if (contextState.isCompleted && !contextState.isAuthenticated && !contextState.isProcessingAuth) {
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
  if (showResults || contextState.isCompleted) {
    return (
      <CodeQuizResult
        title={quizData?.title || "Code Quiz"}
        onRestart={() => window.location.reload()}
        quizId={quizId}
        questions={quizQuestions}
        answers={quizResults?.answers || contextState.answers || []}
        score={quizResults?.score || contextState.score || 0}
        isGuestMode={!contextState.isAuthenticated}
      />
    )
  }

  // If there's no current question and we're not showing results, show a loading indicator
  if (!currentQuestion && !showResults) {
    return <LoadingDisplay />
  }

  // Otherwise, show the quiz
  return (
    <div className="space-y-6">
      {process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEBUG_MODE === "true" && (
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-md">
          <h3 className="text-sm text-slate-700">Quiz State Debug</h3>
          <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-60 mt-2">
            {JSON.stringify(contextState, null, 2)}
          </pre>
        </div>
      )}

      <CodingQuiz
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={currentQuestionIndex + 1}
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
