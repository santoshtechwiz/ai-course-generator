"use client"

import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle, RotateCcw, Loader2, Clock, CheckCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { QuizProvider, useQuiz } from "@/app/context/QuizContext"
import { quizService } from "@/lib/quiz-service"
import { useEffect, useState, useRef } from "react"
import { useAuth } from "@/providers/unified-auth-provider"
import { GuestSignInPrompt } from "../../components/GuestSignInPrompt"

import CodeQuizResult from "./CodeQuizResult"
import CodingQuiz from "./CodingQuiz"

interface CodeQuizWrapperProps {
  quizData: any
  slug: string
}

// This is the main wrapper that uses the provider
export default function CodeQuizWrapper({ quizData, slug }: CodeQuizWrapperProps) {
  const { isAuthenticated, user } = useAuth()

  // Enhanced authentication check
  const userIsAuthenticated = isAuthenticated || !!user

  // Add a safety check for quizData
  const safeQuizData = quizData || {
    id: "unknown",
    title: "Quiz",
    quizType: "code",
    slug: slug || "unknown",
    questions: [],
  }

  return (
    <QuizProvider
      quizData={safeQuizData}
      quizType="code"
      slug={slug || "unknown"}
      onAuthRequired={(redirectUrl) => {
        // If user is already authenticated, don't show auth prompt
        if (userIsAuthenticated) {
          console.log("User is already authenticated, skipping auth prompt")
          return
        }

        // Use QuizService API methods instead of direct localStorage access
        quizService.saveAuthRedirect(redirectUrl)

        // Save current quiz state before redirecting
        quizService.savePendingQuizData()

        // Handle auth redirect using the service method with force=true to bypass loop detection
        quizService.handleAuthRedirect(redirectUrl, true)
      }}
    >
      <CodeQuizContent quizData={safeQuizData} slug={slug || "unknown"} />
    </QuizProvider>
  )
}

// This component consumes the context
function CodeQuizContent({ quizData, slug }: { quizData: any; slug: string }) {
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
    isRefreshed,
    authCheckComplete,
    pendingAuthRequired,
    savingResults,
    resultsReady,
    isLoadingResults,
    requiresAuth,
    hasGuestResult,
  } = state

  // Enhanced authentication check
  const userIsAuthenticated = authState || !!user || isAuthenticated

  // Check URL parameters for auth return
  const [isReturningFromAuth, setIsReturningFromAuth] = useState(false)
  const preparingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const processingAttempted = useRef(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const fromAuth = urlParams.get("fromAuth") === "true"
      setIsReturningFromAuth(fromAuth)

      // If returning from auth, try to process results immediately
      if (fromAuth && !processingAttempted.current) {
        processingAttempted.current = true
        console.log("Detected return from auth, attempting to fetch results immediately")
        fetchQuizResults().catch((err) => {
          console.error("Error fetching results on auth return:", err)
        })
      }
    }
  }, [fetchQuizResults])

  // Add a timeout to prevent getting stuck in the initialization phase
  useEffect(() => {
    // Force exit from checking state after 3 seconds if still stuck
    if (displayState === "checking") {
      const timeoutId = setTimeout(() => {
        console.log("Forcing exit from checking state after timeout")
        setDisplayState("quiz")
      }, 3000)

      return () => clearTimeout(timeoutId)
    }

    // Force exit from preparing state after 5 seconds if still stuck
    if (displayState === "preparing") {
      preparingTimeoutRef.current = setTimeout(() => {
        console.log("Forcing exit from preparing state after timeout")
        // Try to fetch results one more time
        fetchQuizResults()
          .catch(() => {
            console.log("Final attempt to fetch results failed, proceeding to quiz")
          })
          .finally(() => {
            // Move to results if completed, otherwise to quiz
            if (isCompleted && (resultsReady || answers.some((a) => a !== null))) {
              setDisplayState("results")
            } else {
              setDisplayState("quiz")
            }
          })
      }, 5000)

      return () => {
        if (preparingTimeoutRef.current) {
          clearTimeout(preparingTimeoutRef.current)
        }
      }
    }
  }, [displayState, isCompleted, resultsReady, answers, fetchQuizResults])

  // Update display state based on all the available state information
  useEffect(() => {
    // Initial checking state
    if (!authCheckComplete) {
      console.log("Auth check not complete, waiting...")
      // Only stay in checking state for a maximum of 2 seconds
      const timeoutId = setTimeout(() => {
        console.log("Auth check timeout, proceeding anyway")
        setDisplayState("quiz")
      }, 2000)

      return () => clearTimeout(timeoutId)
    }

    // Processing auth return
    if (isProcessingAuth || isReturningFromAuth) {
      console.log("Processing auth or returning from auth, setting state to preparing")
      setDisplayState("preparing")
      return
    }

    // Loading state
    if (isLoading || isLoadingResults) {
      setDisplayState("loading")
      return
    }

    // Saving results
    if (savingResults) {
      setDisplayState("saving")
      return
    }

    // Completed quiz states
    if (isCompleted) {
      // Auth required
      if (requiresAuth && !userIsAuthenticated) {
        setDisplayState("auth")
        return
      }

      // Results ready
      if (resultsReady || answers.some((a) => a !== null)) {
        console.log("Results ready or answers found, showing results")
        setDisplayState("results")
        return
      }
    }

    // Default to quiz
    setDisplayState("quiz")
  }, [
    authCheckComplete,
    isProcessingAuth,
    isReturningFromAuth,
    isLoading,
    isLoadingResults,
    savingResults,
    isCompleted,
    requiresAuth,
    userIsAuthenticated,
    resultsReady,
    answers,
  ])

  // Get current question data
  const currentQuestionData = quizData?.questions?.[currentQuestionIndex] || null

  // Handle answer submission
  const handleAnswer = (answer: string, timeSpent: number, isCorrect: boolean) => {
    // Create answer object
    const answerObj = {
      answer,
      timeSpent,
      isCorrect,
      hintsUsed: false,
    }

    // Submit answer
    submitAnswer(answer, timeSpent, isCorrect)

    // If this is the last question, complete the quiz
    if (currentQuestionIndex >= questionCount - 1) {
      const finalAnswers = [...answers.slice(0, currentQuestionIndex), answerObj]
      completeQuiz(finalAnswers)
    }
  }

  // Handle authentication required
  const handleAuthRequired = () => {
    // Get the current URL to redirect back after sign in
    const redirectUrl = `${window.location.origin}/dashboard/code/${slug}?completed=true`

    // Save auth redirect info
    quizService.saveAuthRedirect(redirectUrl)

    // Save current quiz state before redirecting
    quizService.savePendingQuizData()

    // Handle auth redirect using the service method
    quizService.handleAuthRedirect(redirectUrl, true)
  }

  // Show loading state during initial auth check
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

        {/* Skeleton loading UI for better visual feedback */}
        <div className="w-full max-w-md mt-4">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </motion.div>
    )
  }

  // Preparing results after authentication
  if (displayState === "preparing") {
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
          <p className="text-lg font-medium mb-1">Preparing your results</p>
          <p className="text-sm text-muted-foreground">We're retrieving your quiz results after sign-in...</p>
        </div>

        <div className="w-full max-w-md mt-4 bg-muted/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Authentication successful</span>
          </div>
          <div className="flex items-center space-x-2 text-sm mt-2">
            <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
            <span>Processing quiz data...</span>
          </div>

          {/* Add a manual retry button that appears after 3 seconds */}
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchQuizResults().then(() => {
                  if (isCompleted) {
                    setDisplayState("results")
                  } else {
                    setDisplayState("quiz")
                  }
                })
              }}
              className="mt-2"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Retry Loading Results
            </Button>
          </div>
        </div>
      </motion.div>
    )
  }

  // Loading and processing state with enhanced visuals
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
          <p className="text-sm text-muted-foreground">
            {isLoadingResults ? "Retrieving your previous answers..." : "Preparing your quiz experience..."}
          </p>
        </div>

        {/* Skeleton loading UI for better visual feedback */}
        <div className="w-full max-w-md mt-4">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-32 w-full mb-4" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </motion.div>
    )
  }

  // Saving results state
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
          <p className="text-sm text-muted-foreground">Please wait while we save your quiz results...</p>
        </div>

        <div className="w-full max-w-md mt-4 bg-muted/50 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Quiz completed successfully</span>
          </div>
          <div className="flex items-center space-x-2 text-sm mt-2">
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
            <span>Saving to your account...</span>
          </div>
        </div>
      </motion.div>
    )
  }

  // Error state with improved visuals
  if (error || !quizData || !quizData.questions || quizData.questions.length === 0) {
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
              <Button onClick={() => router.push("/dashboard/code")} variant="default">
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

  // No answers found state
  if (isCompleted && (!answers || answers.filter((a) => a !== null).length === 0) && score === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl mx-auto p-4"
      >
        <Alert variant="default" className="bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-lg">No answers found</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-4">
              We couldn't find your quiz answers. This may happen if you signed out and back in, or if there was an
              issue loading your answers.
            </p>
            <div className="mt-4 flex gap-3">
              <Button
                onClick={retryLoadingResults}
                variant="default"
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Retry Loading Results
              </Button>
              <Button onClick={restartQuiz} variant="outline">
                Start New Quiz
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </motion.div>
    )
  }

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
              allowContinue={false}
              onContinueAsGuest={() => setDisplayState("results")}
             
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
          >
            <CodeQuizResult
              quizId={quizId || "unknown"}
          
              title={title || quizData.title || ""}
              answers={answers.filter((a) => a !== null).map((a) => ({
                ...a,
                isCorrect: a?.isCorrect ?? false,
              }))}
              questions={quizData.questions}
              onRestart={restartQuiz}
            />
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
              <CodingQuiz
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
