"use client"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { memo, useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

import McqQuiz from "./McqQuiz"
import McqQuizResult from "./McqQuizResult"
import { useQuiz, QuizProvider } from "@/app/context/QuizContext"
import { quizService } from "@/lib/quiz-service"
import type { Question } from "./types"
import { useAuth } from "@/providers/unified-auth-provider"
import { GuestPrompt } from "../../components/GuestSignInPrompt"

interface McqQuizContentProps {
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

// Memoize the content component to prevent unnecessary re-renders
const McqQuizContent = memo(function McqQuizContent({ quizData, questions, slug }: McqQuizContentProps) {
  const { state, submitAnswer, completeQuiz, restartQuiz, isAuthenticated } = useQuiz()
  const router = useRouter()
  const { isAuthenticated: authState, user } = useAuth()
  const { currentQuestionIndex, questionCount, isLoading, error, isCompleted, answers, isProcessingAuth } = state

  const [displayState, setDisplayState] = useState<"quiz" | "results" | "auth" | "loading">(
    isLoading || isProcessingAuth ? "loading" : "quiz",
  )

  // Check if we should show the auth prompt for non-authenticated users
  useEffect(() => {
    let timer: NodeJS.Timeout

    // Enhanced authentication check
    const userIsAuthenticated = authState || !!user || isAuthenticated

    // Check URL parameters for completed=true
    const urlParams = new URLSearchParams(window.location.search)
    const isCompletedFromUrl = urlParams.get("completed") === "true"

    // If URL has completed=true but user is not authenticated, show auth prompt
    if (isCompletedFromUrl && !userIsAuthenticated && displayState === "results" && !isLoading && !isProcessingAuth) {
      timer = setTimeout(() => {
        console.log("URL has completed=true but user is not authenticated, showing auth prompt")
        setDisplayState("auth")
      }, 2000) // 2 seconds delay
    }
    // Only transition from results to auth prompt if:
    // 1. User is not authenticated
    // 2. Quiz is completed
    // 3. Currently showing results
    else if (!userIsAuthenticated && isCompleted && displayState === "results" && !isLoading && !isProcessingAuth) {
      // Add a delay before showing the auth prompt
      timer = setTimeout(() => {
        console.log("Transitioning from results to auth prompt")
        setDisplayState("auth")
      }, 3000) // 3 seconds to ensure results are seen
    }

    // Update display state based on quiz state
    if (isLoading || isProcessingAuth) {
      setDisplayState("loading")
    } else if (isCompleted && displayState !== "auth") {
      // Only set to results if not already showing auth
      if (displayState !== "results") {
        setDisplayState("results")
      }
    } else if (!isCompleted && displayState !== "quiz") {
      setDisplayState("quiz")
    }

    return () => clearTimeout(timer)
  }, [authState, user, isAuthenticated, isCompleted, isLoading, isProcessingAuth, displayState])

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

  // Enhanced authentication check
  const userIsAuthenticated = authState || !!user || isAuthenticated

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
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" aria-hidden="true"></div>
            <p className="text-sm text-muted-foreground">
              {isProcessingAuth ? "Processing your results..." : "Loading quiz data..."}
            </p>
          </motion.div>
        ) : displayState === "auth" && !userIsAuthenticated ? (
          <motion.div
            key="auth-prompt"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <GuestPrompt
              quizId={quizData?.id || "unknown"}
              forceShow={true}
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
          >
            <McqQuizResult
              title={quizData?.title || "Quiz"}
              onRestart={restartQuiz}
              quizId={quizData?.id || "unknown"}
              questions={questions}
              answers={state.answers}
              score={state.score}
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

  // Log quiz data for debugging
  useEffect(() => {
    console.log("McqQuizWrapper initialized with:", {
      quizId: validQuizId || "missing",
      slug: validSlug || "missing",
      hasQuestions: questions?.length > 0,
    })
  }, [validQuizId, validSlug, questions])

  useEffect(() => {
    // Prevent double initialization
    if (hasInitialized.current) return
    hasInitialized.current = true

    // Short delay to allow state to initialize
    const timer = setTimeout(() => {
      setIsInitializing(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

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
    id: validQuizId,
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
      quizData={{
        ...safeQuizData,
        questions,
      }}
      slug={validSlug}
      onAuthRequired={(redirectUrl) => {
        // If user is already authenticated, don't show auth prompt
        if (userIsAuthenticated) {
          console.log("User is already authenticated, skipping auth prompt")
          return
        }

        // Save auth redirect info
        quizService.saveAuthRedirect(redirectUrl)

        // Save current quiz state before redirecting
        quizService.savePendingQuizData()

        // Handle auth redirect using the service method
        quizService.handleAuthRedirect(redirectUrl)
      }}
    >
      <McqQuizContent quizData={safeQuizData} questions={questions} slug={validSlug} />
    </QuizProvider>
  )
}
