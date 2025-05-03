"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { QuizProvider } from "@/app/context/QuizContext"
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
import { Skeleton } from "@/components/ui/skeleton"

interface McqQuizWrapperProps {
  quizData: any
  slug: string
}

/**
 * McqQuizWrapper - Handles the display and state management for MCQ quizzes
 */
export default function McqQuizWrapper({ quizData, slug }: McqQuizWrapperProps) {
  console.log("quizData", quizData);
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showGuestPrompt, setShowGuestPrompt] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<any>(null)
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

  // Initialize answers array on component mount
  useEffect(() => {
    if (quizData?.questions && Array.isArray(quizData?.questions)) {
      // Initialize answers array with nulls
      setAnswers(Array(quizData?.questions.length).fill(null))
    }
  }, [quizData?.questions])



  // Check if we should show results when state changes
  useEffect(() => {
    if (safeState.isCompleted) {
      if (safeState.isAuthenticated) {
        setShowResults(true)
      }
      // Remove any other conditions here that might override the GuestSignInPrompt
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

  // Memoize the current question to prevent unnecessary re-renders
  const currentQuestion = React.useMemo(() => {
    return quizData?.questions?.[currentQuestionIndex]
  }, [quizData?.questions, currentQuestionIndex])

  const isLastQuestion = currentQuestionIndex === (quizData?.questions?.length ?? 0) - 1

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
        const totalQuestions = quizData?.questions?.length || 0
        const score = quizUtils.quizUtils.calculateScore(
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

        // Calculate total time
        const totalTimeSpent = calculateTotalTime(answersArray.filter(Boolean))
        const formattedTimeSpent = formatQuizTime(totalTimeSpent)

        // Prepare result data
        const quizId = quizData?.id
        const quizResult = {
          quizId,
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
    [isCompleting, completeQuiz, quizData?.questions, slug, startTime, safeState.isAuthenticated, quizData?.id],
  )

  // Handle continuing as guest
  const handleContinueAsGuest = useCallback(() => {
    setShowResults(true)
  }, [])
  console.log("error", error);
  // Handle sign in
  const handleSignIn = useCallback(() => {
    if (handleAuthenticationRequired) {
      handleAuthenticationRequired(`/dashboard/mcq/${slug}?fromAuth=true`)
    }
  }, [handleAuthenticationRequired, slug])

  // Handle authentication check
  useEffect(() => {
    if (status !== "loading") {
      setIsLoading(false)
    }
  }, [status])

  // Handle authentication requirement
  const handleAuthRequired = (redirectUrl: string) => {
    setShowGuestPrompt(true)
  }

  // Handle sign in
  const handleSignInNew = () => {
    const redirectUrl = typeof window !== "undefined" ? window.location.href : ""
    router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(redirectUrl)}`)
  }

  // Handle continue as guest
  const handleContinueAsGuestNew = () => {
    setShowGuestPrompt(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  // Show guest sign-in prompt if needed
  if (showGuestPrompt) {
    return (
      <GuestSignInPrompt
        onSignIn={handleSignInNew}
        onContinueAsGuest={handleContinueAsGuestNew}
        data-testid="guest-sign-in-prompt"
      />
    )
  }

  // If no state is available, show a loading indicator
  if (!safeState) {
    return (
      <Card className="p-6 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p>Loading quiz state...</p>
      </Card>
    )
  }

  // Determine what content to show
  let content

  if (error) {
    content = (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center gap-4">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <h3 className="text-xl font-semibold">Error Loading Quiz</h3>
          <p className="text-muted-foreground">{getUserFriendlyErrorMessage(error)}</p>
          <Button onClick={() => router.push("/dashboard/mcq")}>Return to Quiz List</Button>
        </div>
      </Card>
    )
  } else if (!currentQuestion && !showResults) {
    content = (
      <Card className="p-6 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p>Loading questions...</p>
      </Card>
    )
  } else if (safeState.isCompleted && !safeState.isAuthenticated && !safeState.isProcessingAuth) {
    content = (
      <GuestSignInPrompt
        onContinueAsGuest={handleContinueAsGuest}
        onSignIn={handleSignIn}
        quizType="quiz"
        showSaveMessage={true}
      />
    )
  } else if (showResults && quizResults) {
    content = <McqQuizResult result={quizResults} />
  } else {
    content = (
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

        <QuizProvider quizData={quizData} slug={slug} quizType="mcq" onAuthRequired={handleAuthRequired}>
          <McqQuiz
            question={currentQuestion}
            onAnswer={handleAnswer}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={quizData?.questions?.length || 0}
            isLastQuestion={isLastQuestion}
          />
        </QuizProvider>

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

  return <>{content}</>
}
