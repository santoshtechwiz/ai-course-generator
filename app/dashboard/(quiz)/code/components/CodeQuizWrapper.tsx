"use client"

import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle, LogIn, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useQuiz, QuizProvider } from "@/app/context/QuizContext"
import { ErrorDisplay, LoadingDisplay, PreparingDisplay, SavingDisplay, InitializingDisplay, QuizNotFoundDisplay, EmptyQuestionsDisplay } from "@/app/dashboard/components/QuizStateDisplay"
import { CodeQuizContentProps, CodeQuizWrapperProps } from "@/app/types/code-quiz-types"
import { QuizType } from "@/lib/quiz-utils"
import { determineDisplayState, createSafeQuizData } from "@/lib/utils/quiz-state-utils"
import { useAuth } from "@/providers/unified-auth-provider"
import { memo, useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { GuestSignInPrompt } from "../../components/GuestSignInPrompt"
import CodeQuizResult from "./CodeQuizResult"
import CodingQuiz from "./CodingQuiz"


// Memoize the content component to prevent unnecessary re-renders
export const CodeQuizContent = memo(function CodeQuizContent({ quizData, slug, userId, quizId }: CodeQuizContentProps) {
  const {
    state,
    submitAnswer,
    completeQuiz,
    restartQuiz,
    isAuthenticated,
    handleAuthenticationRequired,
    fetchQuizResults,
    clearGuestResults,
    dispatch,
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
    isLoadingResults,
    savingResults,
    requiresAuth,
  } = state

  const [displayState, setDisplayState] = useState<
    "quiz" | "results" | "auth" | "loading" | "checking" | "saving" | "preparing"
  >("checking")

  // Enhanced authentication check
  const userIsAuthenticated = authState || !!user || isAuthenticated

  // Check URL parameters for auth return
  const [isReturningFromAuth, setIsReturningFromAuth] = useState(false)

  // Update the useEffect that handles returning from authentication to be more robust
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const fromAuth = urlParams.get("fromAuth") === "true"
      setIsReturningFromAuth(fromAuth)

      // If returning from auth or state indicates we're processing auth, handle it
      if ((fromAuth || state.isProcessingAuth) && !isReturningFromAuth) {
        // Set a loading state immediately
        setDisplayState("preparing")

        // Now fetch quiz results
        fetchQuizResults()
          .then((success) => {
            // Force transition to appropriate state based on result
            if (success && userIsAuthenticated) {
              setDisplayState("results")

              // Clean up URL parameters
              if (window.history && window.history.replaceState) {
                const url = new URL(window.location.href)
                url.search = ""
                window.history.replaceState({}, document.title, url.toString())
              }
            } else {
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
  }, [fetchQuizResults, userIsAuthenticated, state.isProcessingAuth, isReturningFromAuth])

  // Update display state based on all the available state information
  useEffect(() => {
    const newDisplayState = determineDisplayState(state, userIsAuthenticated, isReturningFromAuth)
    setDisplayState(newDisplayState)
  }, [state, userIsAuthenticated, isReturningFromAuth])

  // Get current question data
  const currentQuestionData = quizData?.questions?.[currentQuestionIndex] || null

  // Update the handleAnswer function in CodeQuizContent to properly handle answers
  const handleAnswer = (answer: string, timeSpent: number, isCorrect: boolean) => {
    // Create answer object with the correct format for code quizzes
    const answerObj = {
      answer,
      timeSpent,
      isCorrect,
      hintsUsed: false,
      // Add these fields to match the API expectations for code quizzes
      userAnswer: answer, // This is critical - API expects userAnswer field
      language: currentQuestionData?.language || "javascript", // Use question language or default
    }

    // Submit answer
    submitAnswer(answer, timeSpent, isCorrect)

    // If this is the last question, complete the quiz
    if (currentQuestionIndex >= questionCount - 1) {
      // Make sure we include the current answer in the final answers array
      const finalAnswers = [...answers.slice(0, currentQuestionIndex), answerObj]

      // For unauthenticated users, set requiresAuth flag to true
      if (!userIsAuthenticated) {
        dispatch({ type: "SET_REQUIRES_AUTH", payload: true })
        dispatch({ type: "SET_PENDING_AUTH_REQUIRED", payload: true })
      }

      completeQuiz(finalAnswers)
    }
  }

  // Handle Go Back button click - match with McqQuizWrapper
  const handleGoBack = () => {
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

  // Handle authentication required - match with McqQuizWrapper
  const handleSignIn = () => {
    // Create the redirect URL
    const redirectUrl = `/dashboard/code/${slug}?fromAuth=true`

    // Call the authentication handler
    handleAuthenticationRequired(redirectUrl)
  }

  // Early return for error states
  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => window.location.reload()}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <AnimatePresence mode="wait">
        {displayState === "loading" && <LoadingDisplay isLoadingResults={isLoadingResults} />}

        {displayState === "preparing" && (
          <PreparingDisplay
            onRetry={() => {
              fetchQuizResults().then((success) => {
                if (success && userIsAuthenticated) {
                  setDisplayState("results")
                } else {
                  setDisplayState("quiz")
                }
              })
            }}
          />
        )}

        {displayState === "saving" && <SavingDisplay />}

        {displayState === "auth" && !userIsAuthenticated && (
          <motion.div
            key="auth-prompt"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <GuestSignInPrompt
              title="Sign in to view your results"
              allowContinue={true}
              onContinueAsGuest={handleGoBack}
              onSignIn={handleSignIn}
              onClearData={() => {
                // Only available in development mode
                if (process.env.NODE_ENV !== "production") {
                  window.location.reload()
                }
              }}
              showClearDataButton={process.env.NODE_ENV !== "production"}
            />
          </motion.div>
        )}

        {(displayState === "results" || (displayState === "auth" && userIsAuthenticated)) && (
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
            <CodeQuizResult
              title={quizData?.title || "Quiz"}
              onRestart={restartQuiz}
              quizId={quizId}
              questions={quizData?.questions}
              answers={state.answers}
              score={state.score}
              isGuestMode={!userIsAuthenticated}
            />
          </motion.div>
        )}

        {displayState === "quiz" && (
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
  const { isAuthenticated, user } = useAuth()
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

  // Create a safe quiz data object
  const safeQuizData = createSafeQuizData(quizData, validSlug, "code")

  // Enhanced authentication check
  const userIsAuthenticated = isAuthenticated || !!user

  return (
    <QuizProvider
      quizData={{
        quizId: validQuizId,
        id: validQuizId,
        title: safeQuizData.title,
        description: quizData?.description,
        questions: safeQuizData.questions,
        isPublic: safeQuizData.isPublic,
        isFavorite: safeQuizData.isFavorite,
        userId: safeQuizData.userId,
        difficulty: safeQuizData.difficulty,
        slug: validSlug,
      }}
      slug={validSlug}
      quizType={QuizType.CODE}
      onAuthRequired={(redirectUrl) => {
        // If user is already authenticated, don't show auth prompt
        if (userIsAuthenticated) {
          return
        }

        // Redirect to auth page
        window.location.href = "/api/auth/signin?callbackUrl=" + encodeURIComponent(redirectUrl)
      }}
    >
      <CodeQuizContent quizData={safeQuizData} slug={validSlug} userId={userId} quizId={validQuizId} />
    </QuizProvider>
  )
}
