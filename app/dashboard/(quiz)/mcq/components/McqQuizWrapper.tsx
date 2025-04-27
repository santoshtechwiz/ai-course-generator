"use client"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { memo, useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

import McqQuiz from "./McqQuiz"
import McqQuizResult from "./McqQuizResult"
import { useQuiz, QuizProvider } from "@/app/context/QuizContext"
import { quizService } from "@/lib/QuizService"
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
  const { isAuthenticated: authState } = useAuth()
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)

  const { currentQuestionIndex, questionCount, isLoading, error, isCompleted, answers, isProcessingAuth } = state

  // Check if we should show the auth prompt for non-authenticated users
  useEffect(() => {
    if (!authState && isCompleted && !isLoading && !isProcessingAuth) {
      console.log("User is not authenticated and quiz is completed, showing auth prompt")
      setShowAuthPrompt(true)
    } else {
      setShowAuthPrompt(false)
    }
  }, [authState, isCompleted, isLoading, isProcessingAuth])

  // Early return for error states
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Error loading quiz</AlertTitle>
        <AlertDescription>
          {error || "We couldn't load the quiz data. Please try again later."}
          <div className="mt-4">
            <Button onClick={() => router.push("/dashboard/mcq")}>Return to Quiz Creator</Button>
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

  return (
    <div className="w-full max-w-3xl mx-auto p-4">
      <AnimatePresence mode="wait">
        {isLoading || isProcessingAuth ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[200px] gap-3"
            aria-live="polite"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" aria-hidden="true"></div>
            <p className="text-sm text-muted-foreground">
              {isProcessingAuth ? "Processing your results..." : "Loading quiz data..."}
            </p>
          </motion.div>
        ) : showAuthPrompt && !isAuthenticated && isCompleted ? (
          <motion.div
            key="auth-prompt"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <GuestPrompt quizId={quizData.id} forceShow={true} />
          </motion.div>
        ) : isCompleted ? (
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
              quizId={quizData.id}
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
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
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

  return (
    <QuizProvider
      quizData={{
        ...quizData,
        questions,
      }}
      slug={slug}
      onAuthRequired={(redirectUrl) => {
        // Save auth redirect info
        quizService.saveAuthRedirect(redirectUrl)

        // Save current quiz state before redirecting
        quizService.savePendingQuizData()

        // Add fromAuth parameter to the callback URL
        const callbackUrl = new URL(redirectUrl, window.location.origin)
        callbackUrl.searchParams.set("fromAuth", "true")

        // Redirect to sign in page
        if (typeof window !== "undefined") {
          window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl.toString())}`
        }
      }}
    >
      <McqQuizContent quizData={quizData} questions={questions} slug={slug} />
    </QuizProvider>
  )
}
