"use client"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle, RotateCcw, Loader2, Clock, CheckCircle, LogIn, Info } from "lucide-react"
import { QuizProvider, useQuiz } from "@/app/context/QuizContext"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { quizService } from "@/lib/quiz-service"
import { useAuth } from "@/providers/unified-auth-provider"
import { useState, useEffect, useRef } from "react"
import { GuestSignInPrompt } from "../../components/GuestSignInPrompt"
import BlankQuizResults from "./BlankQuizResults"
import FillInTheBlanksQuiz from "./FillInTheBlanksQuiz"
import { toast } from "@/hooks/use-toast"

interface BlankQuizWrapperProps {
  quizData: any
  slug: string
}

// This is the main wrapper that uses the provider
export default function BlankQuizWrapper({ quizData, slug }: BlankQuizWrapperProps) {
  const { isAuthenticated, user } = useAuth()

  // Enhanced authentication check
  const userIsAuthenticated = isAuthenticated || !!user

  // Add a safety check for quizData
  const safeQuizData = quizData || {
    id: "unknown",
    title: "Quiz",
    slug: slug || "unknown",
    quizType: "blanks",
    questions: [],
  }

  return (
    <QuizProvider
      quizData={safeQuizData}
      slug={slug || "unknown"}
      quizType="blanks"
      onAuthRequired={(redirectUrl) => {
        // If user is already authenticated, don't show auth prompt
        if (userIsAuthenticated) {
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
      <BlankQuizContent quizData={safeQuizData} slug={slug || "unknown"} />
    </QuizProvider>
  )
}

// Update the BlankQuizContent component to align with MCQ auth flow
function BlankQuizContent({ quizData, slug }: { quizData: any; slug: string }) {
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
  // Start directly in quiz state instead of checking
  const [displayState, setDisplayState] = useState<"quiz" | "results" | "auth" | "loading" | "saving" | "preparing">(
    "quiz",
  )

  const {
    quizId,
    title,
    questionCount,
    currentQuestionIndex,
    answers,
    isCompleted,
    isLoading,
    error,
    isProcessingAuth,
    animationState,
    isRefreshed,
    score,
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
  const preparingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const processingAttempted = useRef(false)

  // Improve loading UX and fix auth flow issues in BlankQuizWrapper

  // Update the useEffect that handles returning from authentication to be more robust
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const fromAuth = urlParams.get("fromAuth") === "true"
      setIsReturningFromAuth(fromAuth)

      if (fromAuth && userIsAuthenticated && !processingAttempted.current) {
        processingAttempted.current = true

        // Process pending data
        const pendingDataStr = localStorage.getItem("pendingQuizData")
        if (pendingDataStr) {
          try {
            // Clear pending data
            localStorage.removeItem("pendingQuizData")
            localStorage.removeItem("quizAuthRedirect")
            localStorage.removeItem("inAuthFlow")

            // Fetch quiz results
            fetchQuizResults().catch(() => {
              // Handle errors silently
            })
          } catch (e) {
            console.error("Error processing pending data:", e)
          }
        }
      }
    }
  }, [fetchQuizResults, userIsAuthenticated])

  // Force exit from preparing state after 5 seconds if still stuck
  useEffect(() => {
    if (displayState === "preparing") {
      preparingTimeoutRef.current = setTimeout(() => {
        // Try to fetch results one more time
        fetchQuizResults()
          .catch(() => {})
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
    // Processing auth return
    if (isProcessingAuth || isReturningFromAuth) {
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
      // If user is authenticated, always show results
      if (userIsAuthenticated) {
        console.log("User is authenticated, showing results directly")
        setDisplayState("results")
        return
      }

      // IMPORTANT: Always require authentication for non-authenticated users to view results
      // This ensures guest users cannot see results without signing in
      console.log("User is not authenticated, showing auth prompt")
      setDisplayState("auth")
      return
    }

    // Default to quiz
    setDisplayState("quiz")
  }, [
    isProcessingAuth,
    isReturningFromAuth,
    isLoading,
    isLoadingResults,
    savingResults,
    isCompleted,
    userIsAuthenticated,
  ])

  // Get current question data
  const currentQuestionData = quizData?.questions?.[currentQuestionIndex] || null

  // Handle answer submission
  const handleAnswer = (answer: string, timeSpent: number, hintsUsed: boolean, similarity?: number) => {
    // Calculate if the answer is correct based on similarity
    const isCorrect = similarity ? similarity > 80 : false

    // Create answer object with all required properties
    const answerObj = {
      answer,
      timeSpent,
      isCorrect,
      hintsUsed,
      similarity: similarity || 0,
    }

    // Submit answer to the context
    submitAnswer(answer, timeSpent, isCorrect)

    // If this is the last question, complete the quiz
    if (currentQuestionIndex >= questionCount - 1) {
      // Create a complete array of answers including the current one
      const finalAnswers = [...answers]
      finalAnswers[currentQuestionIndex] = answerObj

      // Filter out any null answers before completing
      const validAnswers = finalAnswers.filter((a) => a !== null)

      // Add a small delay before completing the quiz
      setTimeout(() => {
        completeQuiz(validAnswers)
      }, 800)
    }
  }

  // Handle go back (restart quiz)
  const handleGoBack = () => {
    console.log("User clicked Go Back, returning to quiz")

    // Clear guest results and restart quiz
    clearGuestResults()
    restartQuiz()

    // Set display state to quiz
    setDisplayState("quiz")

    toast({
      title: "Quiz restarted",
      description: "You can now retake the quiz. Sign in to save your results.",
      variant: "default",
    })
  }

  // Handle authentication required
  const handleSignIn = () => {
    console.log("User clicked Sign In, initiating authentication flow")

    // Create the redirect URL
    const redirectUrl = `/dashboard/blanks/${slug}?fromAuth=true`

    // Save minimal data needed for auth redirect
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "pendingQuizData",
        JSON.stringify({
          quizId: state.quizId,
          slug,
          type: "blanks",
          answers: state.answers,
          score: state.score,
        }),
      )
      localStorage.setItem("quizAuthRedirect", redirectUrl)
      localStorage.setItem("inAuthFlow", "true")
    }

    // Call the authentication handler
    handleAuthenticationRequired()
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
              <Button onClick={() => router.push("/dashboard/blanks")} variant="default">
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
              allowContinue={true}
              onContinueAsGuest={handleGoBack}
              onSignIn={handleSignIn}
              onClearData={() => {
                // Only available in development mode
                if (process.env.NODE_ENV !== "production") {
                  quizService.clearAllStorageData()
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
          >
            {!userIsAuthenticated && (
              <div className="mb-4 p-4 border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-amber-800 dark:text-amber-300">Guest Mode</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                      You're viewing results as a guest. Your progress won't be saved when you leave this page.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-white border-none"
                        onClick={handleSignIn}
                      >
                        <LogIn className="h-3.5 w-3.5 mr-1.5" />
                        Sign in to save results
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                        onClick={() => {
                          toast({
                            title: "Guest Mode Information",
                            description:
                              "In guest mode, you can view your results but they won't be saved to your account or be available after you leave this page.",
                            variant: "default",
                          })
                        }}
                      >
                        <Info className="h-3.5 w-3.5 mr-1.5" />
                        Learn more
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <BlankQuizResults
              answers={answers.filter((a) => a !== null)}
              questions={quizData?.questions || []}
              onRestart={restartQuiz}
              quizId={quizId || "unknown"}
              title={title || ""}
              slug={slug || "unknown"}
              onComplete={(score) => {}}
              onRetryLoading={retryLoadingResults}
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
              <FillInTheBlanksQuiz
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
