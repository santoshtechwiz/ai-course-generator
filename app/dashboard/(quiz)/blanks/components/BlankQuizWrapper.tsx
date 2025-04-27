"use client"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle, RotateCcw } from "lucide-react"
import { QuizProvider, useQuiz } from "@/app/context/QuizContext"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { quizService } from "@/lib/quiz-service"
import { useAuth } from "@/providers/unified-auth-provider"
import { useState, useEffect } from "react"
import { GuestPrompt } from "../../components/GuestSignInPrompt"
import BlankQuizResults from "./BlankQuizResults"
import FillInTheBlanksQuiz from "./FillInTheBlanksQuiz"



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

        // Use QuizService API methods instead of direct localStorage access
        quizService.saveAuthRedirect(redirectUrl)

        // Save current quiz state before redirecting
        quizService.savePendingQuizData()

        // Handle auth redirect using the service method
        quizService.handleAuthRedirect(redirectUrl)
      }}
    >
      <BlankQuizContent quizData={safeQuizData} slug={slug || "unknown"} />
    </QuizProvider>
  )
}

// This component consumes the context
function BlankQuizContent({ quizData, slug }: { quizData: any; slug: string }) {
  const router = useRouter()
  const { state, submitAnswer, completeQuiz, restartQuiz, isAuthenticated, retryLoadingResults } = useQuiz()
  const { isAuthenticated: authState, user } = useAuth()
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [loadingState, setLoadingState] = useState<"initial" | "processing" | "saving" | "none">("initial")
  const [resultsShown, setResultsShown] = useState(false)

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
  } = state

  // Enhanced authentication check
  const userIsAuthenticated = authState || !!user || isAuthenticated

  // Enhanced loading state management
  useEffect(() => {
    if (isProcessingAuth) {
      setLoadingState("processing")
    } else if (isLoading) {
      setLoadingState("initial")
    } else if (animationState === "completing") {
      setLoadingState("saving")
    } else {
      setLoadingState("none")
    }
  }, [isProcessingAuth, isLoading, animationState])

  // Check if we should show the auth prompt for non-authenticated users
  useEffect(() => {
    let timer: NodeJS.Timeout

    // Check URL parameters for completed=true
    const urlParams = new URLSearchParams(window.location.search)
    const isCompletedFromUrl = urlParams.get("completed")?.toLowerCase() === "true"

    // If URL has completed=true but user is not authenticated, show auth prompt after a delay
    if (isCompletedFromUrl && !isAuthenticated && !isLoading && !isProcessingAuth ) {
      // Add a delay before showing the auth prompt to ensure results are calculated
      timer = setTimeout(() => {
        console.log("URL has completed=true but user is not authenticated, showing auth prompt")
        setShowAuthPrompt(true)
      }, 2000) // Delay to ensure results are fully displayed first
      return () => clearTimeout(timer)
    }

    // Only show auth prompt if:
    // 1. User is not authenticated
    // 2. Quiz is completed
    // 3. We have valid results (answers exist and score > 0)
    // 4. Not currently loading or processing
    if (
      !userIsAuthenticated &&
      isCompleted &&
      !isLoading &&
      !isProcessingAuth &&
      answers.filter((a) => a !== null).length > 0 &&
      score > 0
    ) {
      // Add a delay before showing the auth prompt to ensure results are calculated
      timer = setTimeout(() => {
        console.log("User is not authenticated and quiz is completed, showing auth prompt")
        setShowAuthPrompt(true)
      }, 2000) // Longer delay to ensure results are fully displayed first
    } else {
      setShowAuthPrompt(false)
    }

    return () => clearTimeout(timer)
  }, [
    authState,
    user,
    isAuthenticated,
    isCompleted,
    isLoading,
    isProcessingAuth,
    answers,
    score,
    showAuthPrompt,
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

  // Loading and processing state with enhanced visuals
  if (loadingState !== "none") {
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
          <p className="text-lg font-medium mb-1">
            {loadingState === "processing"
              ? "Processing your results"
              : loadingState === "saving"
                ? "Saving your progress"
                : "Loading quiz"}
          </p>
          <p className="text-sm text-muted-foreground">
            {loadingState === "processing"
              ? "We're retrieving your quiz results..."
              : loadingState === "saving"
                ? "Saving your answers..."
                : "Preparing your quiz experience..."}
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
        {isCompleted && showAuthPrompt && !userIsAuthenticated ? (
          <motion.div
            key="auth-prompt"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.3 }}
          >
            <GuestPrompt quizId={quizData?.id || "unknown"} forceShow={true} />
          </motion.div>
        ) : isCompleted && (answers.filter((a) => a !== null).length > 0 || resultsShown) ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="p-4 bg-card rounded-lg shadow-sm border"
            onAnimationComplete={() => {
              setResultsShown(true)
            }}
          >
            <BlankQuizResults
              answers={answers.filter((a) => a !== null)}
              questions={quizData?.questions || []}
              onRestart={restartQuiz}
              quizId={quizId || "unknown"}
              title={title || ""}
              slug={slug || "unknown"}
              onComplete={(score) => {
                console.log("Quiz completed with score:", score)
              }}
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
