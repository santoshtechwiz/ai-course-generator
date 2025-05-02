"use client"
import { useRouter } from "next/navigation"
import { useRef, useEffect, useState, memo } from "react"
import { AlertCircle, Loader2, CheckCircle, Clock, RotateCcw, LogIn, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

import McqQuiz from "./McqQuiz"
import McqQuizResult from "./McqQuizResult"
import { useQuiz, QuizProvider } from "@/app/context/QuizContext"
import { quizService } from "@/lib/quiz-service"
import type { Question } from "./types"
import { useAuth } from "@/providers/unified-auth-provider"
import { GuestSignInPrompt } from "../../components/GuestSignInPrompt"
import { toast } from "@/hooks/use-toast"
import { type QuizDataInput, QuizType } from "@/app/types/quiz-types"

interface McqQuizContentProps {
  quizData: QuizDataInput
  questions: Question[]
  slug: string
}

// Memoize the content component to prevent unnecessary re-renders
export const McqQuizContent = memo(function McqQuizContent({ quizData, questions, slug }: McqQuizContentProps) {
  const {
    state,
    submitAnswer,
    completeQuiz,
    restartQuiz,
    isAuthenticated,
    handleAuthenticationRequired,
    fetchQuizResults,
    clearGuestResults,
  } = useQuiz()
  const router = useRouter()
  const { isAuthenticated: authState, user } = useAuth()

  const {
    currentQuestionIndex,
    questionCount,
    isLoading,
    error,
    isCompleted,
    answers,
    isProcessingAuth,
    authCheckComplete,
    pendingAuthRequired,
    savingResults,
    resultsReady,
    isLoadingResults,
    requiresAuth,
    hasGuestResult,
  } = state

  const [displayState, setDisplayState] = useState<
    "quiz" | "results" | "auth" | "loading" | "checking" | "saving" | "preparing"
  >("checking")

  // Enhanced authentication check
  const userIsAuthenticated = authState || !!user || isAuthenticated

  // Check URL parameters for auth return
  const [isReturningFromAuth, setIsReturningFromAuth] = useState(false)
  const preparingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const processingAttempted = useRef(false)
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const fromAuth = urlParams.get("fromAuth") === "true"
      setIsReturningFromAuth(fromAuth)

      // If returning from auth, try to process results immediately
      if (fromAuth && !processingAttempted.current) {
        processingAttempted.current = true
        console.log("Detected return from auth, attempting to fetch results immediately")

        // Set a timeout to handle cases where processing takes too long
        authTimeoutRef.current = setTimeout(() => {
          toast({
            title: "Authentication timed out",
            description: "The authentication process took too long. Please try again.",
            variant: "destructive",
          })
          // Clear processing state and force transition to quiz state
          setIsReturningFromAuth(false)
          setDisplayState("quiz")
        }, 15000) // 15 second timeout

        // Process pending data first, then fetch results
        quizService
          .processPendingQuizData()
          .then(() => {
            // Clear the timeout since processing completed
            if (authTimeoutRef.current) {
              clearTimeout(authTimeoutRef.current)
              authTimeoutRef.current = null
            }

            // Now fetch quiz results
            return fetchQuizResults()
          })
          .then((success) => {
            // Force transition to appropriate state based on result
            if (success && userIsAuthenticated) {
              console.log("Successfully fetched results after auth, showing results")
              setDisplayState("results")
            } else {
              console.log("No results found after auth or not authenticated, showing quiz")
              setDisplayState("quiz")
            }
          })
          .catch((err) => {
            console.error("Error processing auth data or fetching results:", err)
            toast({
              title: "Error loading results",
              description: "There was a problem loading your quiz results. Please try again.",
              variant: "destructive",
            })
            // Force transition to quiz state on error
            setDisplayState("quiz")
          })
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current)
      }
    }
  }, [fetchQuizResults, userIsAuthenticated])

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
          .then((success) => {
            console.log("Final attempt to fetch results completed with success:", success)
            // Move to results if completed and authenticated, otherwise to quiz
            if (success && userIsAuthenticated) {
              setDisplayState("results")
            } else {
              setDisplayState("quiz")
            }
          })
          .catch(() => {
            console.log("Final attempt to fetch results failed, proceeding to quiz")
            setDisplayState("quiz")
          })
      }, 5000)

      return () => {
        if (preparingTimeoutRef.current) {
          clearTimeout(preparingTimeoutRef.current)
        }
      }
    }
  }, [displayState, isCompleted, resultsReady, answers, fetchQuizResults, userIsAuthenticated])

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
    authCheckComplete,
    isProcessingAuth,
    isReturningFromAuth,
    isLoading,
    isLoadingResults,
    savingResults,
    isCompleted,
    userIsAuthenticated,
  ])

  // Early return for error states with retry button
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Error loading quiz</AlertTitle>
        <AlertDescription>
          <p className="mb-4">{error || "We couldn't load the quiz data. Please try again later."}</p>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button onClick={() => window.location.reload()} className="w-full sm:w-auto">
              Retry Loading Quiz
            </Button>
            <Button onClick={() => router.push("/dashboard/mcq")} variant="outline" className="w-full sm:w-auto">
              Return to Quiz Creator
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Early return for empty questions
  if (!questions || questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">No questions available for this quiz.</p>
          <p className="text-sm text-muted-foreground mb-6">
            This could be because the quiz is still being generated or there was an error during creation.
          </p>
          <Button onClick={() => router.push("/dashboard/mcq")} className="mt-4">
            Return to Quiz Creator
          </Button>
        </CardContent>
      </Card>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]

  // Early return for missing current question
  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Question not found.</p>
          <p className="text-sm text-muted-foreground mb-6">There was an error loading the current question.</p>
          <Button onClick={() => router.push("/dashboard/mcq")} className="mt-4">
            Return to Quiz Creator
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Handle answer submission
  const handleAnswer = (answer: string, timeSpent: number, isCorrect: boolean) => {
    submitAnswer(answer, timeSpent, isCorrect)

    // Check if this is the last question
    if (currentQuestionIndex >= questionCount - 1) {
      // Get all answers including the current one
      const updatedAnswers = [...answers]
      updatedAnswers[currentQuestionIndex] = { answer, timeSpent, isCorrect }

      // Complete the quiz
      setTimeout(() => {
        completeQuiz(updatedAnswers.filter((a) => a !== null))
      }, 1000) // Slightly reduced delay for better UX
    }
  }

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

  const handleSignIn = () => {
    console.log("User clicked Sign In, initiating authentication flow")

    // Create the redirect URL
    const redirectUrl = `/dashboard/mcq/${slug}?fromAuth=true`

    // Save minimal data needed for auth redirect
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "pendingQuizData",
        JSON.stringify({
          quizId: quizData?.id,
          slug,
          type: "mcq",
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

  // Show loading state during initial auth check
  if (displayState === "checking") {
    return (
      <motion.div
        key="auth-checking"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-[200px] gap-3"
      >
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
          </div>
        </div>
        <p className="text-lg font-medium mt-2">Initializing quiz...</p>
        <p className="text-sm text-muted-foreground">Please wait while we prepare your quiz experience.</p>
      </motion.div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <AnimatePresence mode="wait">
        {displayState === "loading" ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[200px] gap-3"
            aria-live="polite"
          >
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
              </div>
            </div>
            <p className="text-lg font-medium mt-2">
              {isLoadingResults ? "Loading your results..." : "Loading quiz data..."}
            </p>
            <p className="text-sm text-muted-foreground">
              {isLoadingResults ? "We're retrieving your quiz results..." : "Preparing your quiz experience..."}
            </p>
          </motion.div>
        ) : displayState === "preparing" ? (
          <motion.div
            key="preparing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[200px] gap-3"
            aria-live="polite"
          >
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
              </div>
            </div>
            <p className="text-lg font-medium mt-2">Preparing your results</p>
            <p className="text-sm text-muted-foreground">We're retrieving your quiz results after sign-in...</p>

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
        ) : displayState === "saving" ? (
          <motion.div
            key="saving"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[200px] gap-3"
            aria-live="polite"
          >
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
              </div>
            </div>
            <p className="text-lg font-medium mt-2">Saving your results</p>
            <p className="text-sm text-muted-foreground">Please wait while we save your quiz results...</p>

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
        ) : displayState === "auth" && !userIsAuthenticated ? (
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
              onContinueAsGuest={handleGoBack} // Use the handleGoBack function here
              onSignIn={handleSignIn} // Use the handleSignIn function here
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
        ) : displayState === "results" || (displayState === "auth" && userIsAuthenticated) ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
            <McqQuizResult
              title={quizData?.title || "Quiz"}
              onRestart={restartQuiz}
              quizId={quizData?.id || "unknown"}
              questions={questions}
              answers={state.answers}
              score={state.score}
              isGuestMode={!userIsAuthenticated}
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
            <McqQuiz
              question={currentQuestion}
              onAnswer={handleAnswer}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questionCount}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

interface McqQuizWrapperProps {
  quizData: {
    id: string
    title: string
    slug: string
    isPublic: boolean
    isFavorite: boolean
    userId: string
    difficulty?: string
  }
  questions: Question[]
  slug: string
}

export default function McqQuizWrapper({ quizData, questions, slug }: McqQuizWrapperProps) {
  const [isInitializing, setIsInitializing] = useState(true)
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()
  const hasInitialized = useRef(false)

  // Validate quiz data and slug
  const validQuizId = quizData?.id && quizData.id !== "unknown" ? quizData.id : null
  const validSlug = slug && slug !== "unknown" ? slug : null

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if we're in a redirect loop
      const urlParams = new URLSearchParams(window.location.search)
      const fromAuth = urlParams.get("fromAuth") === "true"
      const inAuthFlow = localStorage.getItem("inAuthFlow") === "true"

      if (fromAuth && inAuthFlow) {
        console.log("Detected potential redirect loop, clearing auth flow state")
        localStorage.removeItem("inAuthFlow")
        localStorage.removeItem("quizAuthRedirect")
      }
    }
  }, [])

  // Log quiz data for debugging
  useEffect(() => {
    console.log("McqQuizWrapper initialized with:", {
      quizId: validQuizId || "missing",
      slug: validSlug || "missing",
      hasQuestions: questions?.length > 0,
    })
  }, [validQuizId, validSlug, questions])

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <h3 className="text-xl font-semibold mb-2">Loading quiz...</h3>
        <p className="text-muted-foreground text-center max-w-md">Please wait while we load your quiz.</p>
      </div>
    )
  }

  // Error state if quiz data is invalid
  if (!validQuizId || !validSlug) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-xl font-semibold mb-2">Quiz Not Found</h3>
        <p className="text-muted-foreground text-center max-w-md">
          We couldn't find the quiz you're looking for. This could be because the quiz ID or slug is invalid.
        </p>
        <Button onClick={() => router.push("/dashboard/quizzes")} className="mt-6">
          Return to Quizzes
        </Button>
      </div>
    )
  }

  // Early return for empty questions
  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Questions Available</h3>
        <p className="text-muted-foreground text-center max-w-md">
          We couldn't find any questions for this quiz. This could be because the quiz is still being generated or there
          was an error.
        </p>
        <Button onClick={() => router.push("/dashboard/quizzes")} className="mt-6">
          Return to Quizzes
        </Button>
      </div>
    )
  }

  // Add a safety check for quizData
  const safeQuizData = {
    quizId: "", // Add the required quizId property
    id: "",
    title: quizData?.title || "Quiz",
    slug: validSlug,
    isPublic: quizData?.isPublic || false,
    isFavorite: quizData?.isFavorite || false,
    userId: quizData?.userId || "",
    difficulty: quizData?.difficulty || "medium",
  }

  // Enhanced authentication check
  const userIsAuthenticated = isAuthenticated || !!user

  return (
    <QuizProvider
      quizId={quizData?.id || ""}
      quizData={{
        ...safeQuizData,
        questions,
      }}
      quizType={QuizType.MCQ}
      slug={validSlug}
      onAuthRequired={(redirectUrl) => {
        // If user is already authenticated, don't show auth prompt
        if (userIsAuthenticated) {
          console.log("User is already authenticated, skipping auth prompt")
          return
        }

        // Check if already in auth flow to prevent loops
        if (quizService.isInAuthFlow()) {
          console.log("Already in auth flow, preventing potential redirect loop")
          toast({
            title: "Authentication in progress",
            description: "Please complete the sign-in process or refresh the page to try again.",
            variant: "default",
          })
          return
        }

        // Save current quiz state before redirecting
        quizService.savePendingQuizData()

        // Save auth redirect info
        quizService.saveAuthRedirect(redirectUrl)

        // Handle auth redirect using the service method with force=true to bypass loop detection
        quizService.handleAuthRedirect(redirectUrl, true)
      }}
    >
      <McqQuizContent quizData={safeQuizData} questions={questions} slug={validSlug} />
    </QuizProvider>
  )
}
