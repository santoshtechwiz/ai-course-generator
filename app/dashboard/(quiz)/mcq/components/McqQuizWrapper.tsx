"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import McqQuiz from "./McqQuiz"
import McqQuizResult from "./McqQuizResult"
import { Card } from "@/components/ui/card"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import GuestSignInPrompt from "../../components/GuestSignInPrompt"
import { createQuizError, QuizErrorType, getUserFriendlyErrorMessage } from "@/lib/utils/quiz-index"
import { useQuizState } from "@/hooks/useQuizState"
import { useToast } from "@/hooks/use-toast"
import { useQuiz } from "@/app/context/QuizContext"

interface McqQuizWrapperProps {
  quizData?: any
  questions?: any[]
  quizId?: string
  slug: string
  error?: any
}

export default function McqQuizWrapper({ quizData, questions, quizId, slug, error: propError }: McqQuizWrapperProps) {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const authCheckRef = useRef(false)
  const fromAuthRef = useRef(false)

  // Local state
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<any>(propError || null)
  const [startTime] = useState<number>(Date.now())
  const [debugInfo, setDebugInfo] = useState({})
  const [forceShowResultsLocal, setForceShowResultsLocal] = useState(false)

  // Quiz state from Redux
  const {
    state,
    isAuthenticated,
    isLastQuestion,
    currentQuestion,
    initializeQuiz,
    submitAnswer,
    goToNextQuestion,
    completeQuiz,
    restartQuiz,
    handleAuthenticationRequired,
  } = useQuizState()

  // Safely use the quiz context
  const quizContext = useQuiz()

  // Check for fromAuth parameter immediately
  useEffect(() => {
    if (typeof window !== "undefined" && !fromAuthRef.current) {
      const fromAuth = searchParams?.get("fromAuth") === "true"
      if (fromAuth) {
        console.log("Detected fromAuth parameter, forcing results display")
        fromAuthRef.current = true
        setForceShowResultsLocal(true)

        // Clear URL parameter
        const newUrl = window.location.pathname
        window.history.replaceState({}, document.title, newUrl)
      }
    }
  }, [searchParams])

  // Update debug info
  useEffect(() => {
    setDebugInfo({
      sessionStatus,
      isAuthenticated,
      isCompleted: state.isCompleted,
      forceShowResults: state.forceShowResults,
      forceShowResultsLocal,
      fromAuthRef: fromAuthRef.current,
      pendingAuthRedirect: state.pendingAuthRedirect,
      hasUser: !!session?.user,
      userId: session?.user?.id || null,
      email: session?.user?.email || null,
      currentQuestionIndex: state.currentQuestionIndex,
      questionsLength: state.questions.length,
      authCheckRef: authCheckRef.current,
      quizContextAvailable: !!quizContext,
      searchParams: searchParams ? Object.fromEntries(searchParams.entries()) : {},
    })
  }, [sessionStatus, isAuthenticated, state, session, quizContext, searchParams, forceShowResultsLocal])

  // Initialize quiz on component mount
  useEffect(() => {
    if ((quizData || questions) && !state.questions.length) {
      console.log("Initializing quiz in McqQuizWrapper:", { quizId, slug })

      // Get authentication status directly from session
      const isUserAuthenticated = sessionStatus === "authenticated" && !!session?.user

      initializeQuiz({
        id: quizId,
        slug,
        questions: questions || quizData?.questions || [],
        quizType: "mcq",
        requiresAuth: true,
        isAuthenticated: isUserAuthenticated,
      })
    }
  }, [quizData, questions, quizId, slug, initializeQuiz, state.questions.length, sessionStatus, session])

  // Handle URL parameters and authentication state
  useEffect(() => {
    if (typeof window !== "undefined" && !authCheckRef.current) {
      const freshStart = searchParams?.get("fresh") === "true"

      // Handle fresh parameter (restart quiz)
      if (freshStart) {
        console.log("Fresh start requested, restarting quiz")
        restartQuiz()

        // Clear URL parameter
        const newUrl = window.location.pathname
        window.history.replaceState({}, document.title, newUrl)
      }

      authCheckRef.current = true
    }
  }, [searchParams, restartQuiz])

  // Handle sign in
  const handleSignIn = useCallback(() => {
    console.log("Sign in requested, redirecting to authentication")
    handleAuthenticationRequired(`/dashboard/mcq/${slug}?fromAuth=true`)
  }, [handleAuthenticationRequired, slug])

  // Handle back button
  const handleBack = useCallback(() => {
    router.push("/dashboard/quizzes")
  }, [router])

  // Handle try again button
  const handleTryAgain = useCallback(() => {
    console.log("Try again requested, restarting quiz")
    restartQuiz()
    router.push(`/dashboard/mcq/${slug}?fresh=true`)
  }, [router, slug, restartQuiz])

  // Handle answer selection
  const handleAnswer = useCallback(
    (selectedOption: string, timeSpent: number, isCorrect: boolean) => {
      try {
        if (isCompleting) return

        // Get current question details
        const question = currentQuestion?.question || `Question ${state.currentQuestionIndex + 1}`
        const correctOption = currentQuestion?.correctAnswer || currentQuestion?.correctOption

        console.log("Answer submitted:", {
          selectedOption,
          isCorrect,
          questionIndex: state.currentQuestionIndex,
          isLastQuestion,
        })

        // Submit answer to Redux
        submitAnswer({
          answer: selectedOption,
          userAnswer: selectedOption,
          selectedOption: selectedOption,
          correctOption: correctOption,
          question: question,
          isCorrect,
          timeSpent,
          questionId: currentQuestion?.id || state.currentQuestionIndex,
          index: state.currentQuestionIndex,
        })

        // If last question, complete quiz
        if (isLastQuestion) {
          handleQuizCompletion()
        } else {
          // Otherwise, go to next question
          goToNextQuestion()
        }
      } catch (err) {
        console.error("Error handling answer:", err)
        setError(createQuizError(QuizErrorType.UNKNOWN, "Failed to process your answer. Please try again.", err, true))
      }
    },
    [isCompleting, submitAnswer, currentQuestion, state.currentQuestionIndex, isLastQuestion, goToNextQuestion],
  )

  // Handle quiz completion
  const handleQuizCompletion = useCallback(async () => {
    if (isCompleting) return

    setIsCompleting(true)
    console.log("Completing quiz")

    try {
      // Complete quiz in Redux
      await completeQuiz()
    } catch (err) {
      console.error("Error completing quiz:", err)
      setError(createQuizError(QuizErrorType.UNKNOWN, "Failed to complete the quiz. Please try again.", err, true))
    } finally {
      setIsCompleting(false)
    }
  }, [isCompleting, completeQuiz])

  // Determine if we should show results
  // Use session status directly instead of relying on isAuthenticated from the hook
  const isUserAuthenticated = sessionStatus === "authenticated" && !!session?.user

  // CRITICAL FIX: Show results if ANY of these conditions are true:
  // 1. User is authenticated AND quiz is completed
  // 2. forceShowResults is true in Redux
  // 3. forceShowResultsLocal is true (from URL parameter)
  // 4. We detected a fromAuth parameter in the URL
  const shouldShowResults =
    (state.isCompleted && isUserAuthenticated) || state.forceShowResults || forceShowResultsLocal || fromAuthRef.current

  // CRITICAL FIX: Only show sign-in prompt if ALL of these are true:
  // 1. Quiz is completed
  // 2. User is NOT authenticated
  // 3. We're NOT forcing results display
  // 4. We did NOT detect a fromAuth parameter
  const shouldShowSignInPrompt =
    state.isCompleted &&
    !isUserAuthenticated &&
    !state.forceShowResults &&
    !forceShowResultsLocal &&
    !fromAuthRef.current

  // Render function
  const renderContent = () => {
    // If there's an error, show error message
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

    // If session is loading, show loading indicator
    if (sessionStatus === "loading") {
      return (
        <Card className="p-6 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p>Loading...</p>
        </Card>
      )
    }

    // CRITICAL FIX: If we should show results, render results component
    if (shouldShowResults) {
      console.log("Showing quiz results", {
        isCompleted: state.isCompleted,
        isUserAuthenticated,
        forceShowResults: state.forceShowResults,
        forceShowResultsLocal,
        fromAuthRef: fromAuthRef.current,
      })

      return (
        <McqQuizResult
          result={{
            quizId: state.quizId,
            slug: state.slug,
            score: state.score,
            answers: state.answers,
            totalQuestions: state.questions.length,
            correctAnswers: state.answers.filter((a: any) => a && a.isCorrect).length,
            completedAt: state.completedAt || new Date().toISOString(),
          }}
          onTryAgain={handleTryAgain}
          onBackToQuizzes={handleBack}
        />
      )
    }

    // If we should show sign-in prompt, render prompt
    if (shouldShowSignInPrompt) {
      console.log("Showing sign-in prompt", {
        isCompleted: state.isCompleted,
        isUserAuthenticated,
        forceShowResults: state.forceShowResults,
        forceShowResultsLocal,
        fromAuthRef: fromAuthRef.current,
      })

      return <GuestSignInPrompt onSignIn={handleSignIn} onBack={handleBack} data-testid="guest-sign-in-prompt" />
    }

    // If there's no current question, show loading indicator
    if (!currentQuestion) {
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
        <Card className="bg-slate-50 border-slate-200">
          <div className="p-3">
            <h3 className="text-sm text-slate-700">Quiz State Debug</h3>
            <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-60 mt-2">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </Card>

        <McqQuiz
          question={currentQuestion}
          onAnswer={handleAnswer}
          questionNumber={state.currentQuestionIndex + 1}
          totalQuestions={state.questions.length}
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

  return renderContent()
}
