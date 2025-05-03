"use client"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle, LogIn, Info } from "lucide-react"

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/providers/unified-auth-provider"
import { useState, useEffect } from "react"
import GuestSignInPrompt  from "../../components/GuestSignInPrompt"
import BlankQuizResults from "./BlankQuizResults"
import FillInTheBlanksQuiz from "./FillInTheBlanksQuiz"
import { toast } from "@/hooks/use-toast"
import { determineDisplayState, createSafeQuizData, validateInitialQuizData } from "@/lib/utils/quiz-state-utils"
import { QuizProvider, useQuiz } from "@/app/context/QuizContext"
import { ErrorDisplay, LoadingDisplay, PreparingDisplay, SavingDisplay } from "@/app/dashboard/components/QuizStateDisplay"

interface BlankQuizWrapperProps {
  quizData: any
  slug: string
}

// This is the main wrapper that uses the provider
export default function BlankQuizWrapper({ quizData, slug }: BlankQuizWrapperProps) {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  // Enhanced authentication check
  const userIsAuthenticated = isAuthenticated || !!user

  // Validate quiz data
  const validationResult = validateInitialQuizData(quizData)
  if (!validationResult.isValid) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading quiz</AlertTitle>
        <AlertDescription>
          <p className="mb-4">{validationResult.error}</p>
          <Button onClick={() => router.push("/dashboard/blanks")} variant="default">
            Return to Quiz Creator
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  // Create a safe quiz data object
  const safeQuizData = createSafeQuizData(quizData, slug, "blanks")

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

        // Redirect to auth page
        window.location.href = "/api/auth/signin?callbackUrl=" + encodeURIComponent(redirectUrl)
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

  // Use a single display state for all UI states
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
    isLoadingResults,
    savingResults,
    score,
  } = state

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

      if (fromAuth && userIsAuthenticated) {
        // Fetch quiz results
        fetchQuizResults().catch(() => {
          // Handle errors silently
        })
      }
    }
  }, [fetchQuizResults, userIsAuthenticated])

  // Update display state based on all the available state information
  useEffect(() => {
    const newDisplayState = determineDisplayState(state, userIsAuthenticated, isReturningFromAuth)
    setDisplayState(newDisplayState)
  }, [state, isReturningFromAuth, userIsAuthenticated])

  // Get current question data
  const currentQuestionData = quizData?.questions?.[currentQuestionIndex] || null

  // Handle answer submission
  const handleAnswer = (answer: string, timeSpent: number, hintsUsed: boolean, similarity?: number) => {
    // Calculate if the answer is correct based on similarity
    const isCorrect = similarity ? similarity > 80 : false

    // Submit answer to the context
    submitAnswer(answer, timeSpent, isCorrect)

    // If this is the last question, complete the quiz
    if (currentQuestionIndex >= questionCount - 1) {
      // Create a complete array of answers including the current one
      const finalAnswers = [...answers]
      finalAnswers[currentQuestionIndex] = {
        answer,
        timeSpent,
        isCorrect,
        hintsUsed,
        similarity: similarity || 0,
      }

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
    // Create the redirect URL
    const redirectUrl = `/dashboard/blanks/${slug}?fromAuth=true`

    // Call the authentication handler
    handleAuthenticationRequired(redirectUrl)
  }

  // Error state with improved visuals
  if (error || !quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => window.location.reload()}
        onReturn={() => router.push("/dashboard/blanks")}
      />
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {displayState === "loading" && <LoadingDisplay isLoadingResults={isLoadingResults} />}

        {displayState === "preparing" && (
          <PreparingDisplay
            onRetry={() => {
              fetchQuizResults().then(() => {
                if (isCompleted) {
                  setDisplayState("results")
                } else {
                  setDisplayState("quiz")
                }
              })
            }}
          />
        )}

        {displayState === "saving" && <SavingDisplay />}

        {displayState === "auth" && (
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
                  window.location.reload()
                }
              }}
              showClearDataButton={process.env.NODE_ENV !== "production"}
            />
          </motion.div>
        )}

        {displayState === "results" && (
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
