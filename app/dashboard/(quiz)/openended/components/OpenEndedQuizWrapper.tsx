"use client"

import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle } from "lucide-react"

import OpenEndedQuizQuestion from "./OpenEndedQuizQuestion"
import QuizResultsOpenEnded from "./QuizResultsOpenEnded"
import { GuestSignInPrompt } from "../../components/GuestSignInPrompt"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { QuizProvider, useQuiz } from "@/app/context/QuizContext"
import { quizService } from "@/lib/quiz-service"
import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/providers/unified-auth-provider"
import { toast } from "@/hooks/use-toast"

interface OpenEndedQuizWrapperProps {
  quizData: any
  slug: string
}

export default function OpenEndedQuizWrapper({ quizData, slug }: OpenEndedQuizWrapperProps) {
  const { isAuthenticated, user } = useAuth()

  // Enhanced authentication check
  const userIsAuthenticated = isAuthenticated || !!user

  // Add a safety check for quizData
  const safeQuizData = quizData || {
    id: "unknown",
    title: "Quiz",
    slug: slug || "unknown",
    questions: [],
  }

  return (
    <QuizProvider
      quizData={safeQuizData}
      slug={slug || "unknown"}
      onAuthRequired={(redirectUrl) => {
        // If user is already authenticated, don't show auth prompt
        if (userIsAuthenticated) {
          console.log("User is already authenticated, skipping auth prompt")
          return
        }

        // Use QuizService API methods
        quizService.saveAuthRedirect(redirectUrl)
        quizService.savePendingQuizData()

        // Handle auth redirect
        quizService.handleAuthRedirect(redirectUrl, true)
      }}
    >
      <OpenEndedQuizContent quizData={safeQuizData} slug={slug || "unknown"} />
    </QuizProvider>
  )
}

function OpenEndedQuizContent({ quizData, slug }: { quizData: any; slug: string }) {
  const router = useRouter()
  const {
    state,
    submitAnswer,
    completeQuiz,
    restartQuiz,
    isAuthenticated,
    retryLoadingResults,
    handleAuthenticationRequired,
    fetchQuizResults,
    clearGuestResults,
  } = useQuiz()
  const { isAuthenticated: authState, user } = useAuth()
  const [displayState, setDisplayState] = useState<
    "quiz" | "results" | "auth" | "loading" | "checking" | "saving" | "preparing"
  >("checking")

  const {
    quizId,
    title,
    questionCount,
    currentQuestionIndex,
    answers,
    isCompleted,
    isLoading,
    error,
    score,
    isProcessingAuth,
    animationState,
    authCheckComplete,
    pendingAuthRequired,
    savingResults,
    resultsReady,
    isLoadingResults,
    requiresAuth,
    hasGuestResult,
  } = state

  const userIsAuthenticated = authState || !!user || isAuthenticated
  const [isReturningFromAuth, setIsReturningFromAuth] = useState(false)
  const preparingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousAnimationState = useRef(animationState)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const fromAuth = urlParams.get("fromAuth") === "true"
      setIsReturningFromAuth(fromAuth)
    }
  }, [])

  // Main state management effect
  useEffect(() => {
    // For debugging in tests
    if (process.env.NODE_ENV === "test") {
      console.log("State update:", {
        authCheckComplete,
        isProcessingAuth,
        isLoading,
        isLoadingResults,
        savingResults,
        isCompleted,
        userIsAuthenticated,
        resultsReady,
        animationState,
        currentDisplayState: displayState,
      })
    }

    // Initial auth check
    if (!authCheckComplete) {
      const timeout = setTimeout(() => {
        setDisplayState("quiz")
      }, 2000)
      return () => clearTimeout(timeout)
    }

    // Loading states
    if (isLoading || isLoadingResults) {
      setDisplayState("loading")
      return
    }

    // Saving states
    if (savingResults) {
      setDisplayState("saving")
      return
    }

    // Completed quiz states
    if (isCompleted) {
      // If animation state is explicitly showing results, prioritize that
      if (userIsAuthenticated && animationState === "showing-results") {
        setDisplayState("results")
        return
      }

      // Authenticated users with results
      if (userIsAuthenticated && resultsReady) {
        setDisplayState("results")
        return
      }

      // Authenticated users waiting for results
      if (userIsAuthenticated && !resultsReady) {
        // Force transition to results after a timeout to prevent getting stuck
        if (process.env.NODE_ENV === "test") {
          // Use a shorter timeout in tests
          const timeout = setTimeout(() => {
            setDisplayState("results")
          }, 500)
          preparingTimeoutRef.current = timeout
          return () => clearTimeout(timeout)
        } else {
          const timeout = setTimeout(() => {
            setDisplayState("results")
          }, 5000)
          preparingTimeoutRef.current = timeout
          return () => clearTimeout(timeout)
        }

        setDisplayState("preparing")
        return
      }

      // Guest users
      if (!userIsAuthenticated) {
        setDisplayState("auth")
        return
      }
    }

    // Default to quiz
    setDisplayState("quiz")
  }, [
    authCheckComplete,
    isProcessingAuth,
    isLoading,
    isLoadingResults,
    savingResults,
    isCompleted,
    userIsAuthenticated,
    resultsReady,
    animationState,
  ])

  // Add cleanup for timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (preparingTimeoutRef.current) {
        clearTimeout(preparingTimeoutRef.current)
      }
    }
  }, [])

  // Handle answer submission
  const handleAnswer = (answer: string) => {
    const timeSpent = (Date.now() - state.startTime) / 1000
    const answerObj = {
      answer,
      timeSpent,
      isCorrect: true,
      hintsUsed: false,
    }

    submitAnswer(answer, timeSpent, true)

    if (currentQuestionIndex >= questionCount - 1) {
      completeQuiz([...answers.slice(0, currentQuestionIndex), answerObj])
    }
  }

  const handleGoBack = () => {
    if (typeof clearGuestResults === "function") {
      clearGuestResults()
    }
    if (typeof restartQuiz === "function") {
      restartQuiz()
    }
    setDisplayState("quiz")
    toast({
      title: "Quiz restarted",
      description: "You can now retake the quiz. Sign in to save your results.",
      variant: "default",
    })
  }

  const handleSignIn = () => {
    const redirectUrl = `/dashboard/openended/${slug}?fromAuth=true`

    // Save minimal data needed for auth redirect
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "pendingQuizData",
        JSON.stringify({
          quizId: quizId,
          slug,
          type: "openended",
          answers: answers,
          score: score,
        }),
      )
      localStorage.setItem("quizAuthRedirect", redirectUrl)
      localStorage.setItem("inAuthFlow", "true")
    }

    handleAuthenticationRequired()
  }

  const renderQuizResults = () => {
    return (
      <QuizResultsOpenEnded
        quizId={quizId || "unknown"}
        slug={slug || "unknown"}
        title={title || quizData.title || ""}
        answers={answers.filter((a) => a !== null)}
        questions={quizData.questions}
        totalQuestions={questionCount}
        startTime={state.startTime}
        score={score}
        onRestart={restartQuiz}
        onSignIn={handleSignIn}
      />
    )
  }

  if (displayState === "checking") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-[300px] gap-4 py-8"
      >
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium mb-1">Initializing quiz...</p>
          <p className="text-sm text-muted-foreground">Please wait while we prepare your quiz experience.</p>
        </div>
      </motion.div>
    )
  }

  if (displayState === "preparing") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-[300px] gap-4 py-8"
        data-testid="preparing-results"
      >
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium mb-1">Preparing your results</p>
          <p className="text-sm text-muted-foreground">We're retrieving your quiz results after sign-in...</p>
        </div>
      </motion.div>
    )
  }

  if (displayState === "loading") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-[300px] gap-4 py-8"
      >
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium mb-1">{isLoadingResults ? "Loading your results" : "Loading quiz"}</p>
        </div>
      </motion.div>
    )
  }

  if (displayState === "saving") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-[300px] gap-4 py-8"
      >
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
          </div>
        </div>
        <div className="text-center">
          <p className="text-lg font-medium mb-1">Saving your results</p>
        </div>
      </motion.div>
    )
  }

  if (error || !quizData?.questions?.length) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl mx-auto p-4"
      >
        <Alert variant="destructive" className="animate-pulse-once">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg">Error loading quiz</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">{error || "We couldn't load the quiz data. Please try again later."}</p>
            <div className="mt-4 flex gap-3">
              <Button onClick={() => router.push("/dashboard/openended")} variant="default">
                Return to Quiz Creator
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </motion.div>
    )
  }

  const currentQuestionData = quizData.questions[currentQuestionIndex]

  return (
    <div className="w-full max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {displayState === "auth" ? (
          <motion.div
            key="auth-prompt"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <GuestSignInPrompt
              title="Sign in to view your results"
              description="Your quiz has been completed! Sign in to view your detailed results and save your progress."
              ctaText="Sign in to view results"
              allowContinue={true}
              onContinueAsGuest={handleGoBack}
              onSignIn={handleSignIn}
              onClearData={() => {
                if (process.env.NODE_ENV !== "production") {
                  quizService.clearAllStorage()
                  window.location.reload()
                }
              }}
              showClearDataButton={process.env.NODE_ENV !== "production"}
            />
          </motion.div>
        ) : displayState === "results" ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="p-4 bg-card rounded-lg shadow-sm border"
            data-testid="results-wrapper"
          >
            {renderQuizResults()}
          </motion.div>
        ) : (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {currentQuestionData && (
              <OpenEndedQuizQuestion
                question={currentQuestionData}
                onAnswer={handleAnswer}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={questionCount}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
