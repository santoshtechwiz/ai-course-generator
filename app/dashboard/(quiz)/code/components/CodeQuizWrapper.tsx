"use client"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { memo, useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

import CodingQuiz from "./CodingQuiz"
import CodeQuizResult from "./CodeQuizResult"
import { useQuiz, QuizProvider } from "@/app/context/QuizContext"
import { GuestPrompt } from "../../components/GuestSignInPrompt"
import { quizService } from "@/lib/quiz-service"
import { useAuth } from "@/providers/unified-auth-provider"

interface Question {
  id: string
  question: string
  code?: string
  options: string[]
  answer: string
  explanation?: string
  difficulty: string
  timeLimit?: number
}

interface QuizData {
  id?: string
  title: string
  description?: string
  questions: Question[]
  type?: "code" | "mcq" | "openended"
  createdAt?: Date
  updatedAt?: Date
}

interface QuizAnswer {
  answer: string
  timeSpent: number
  isCorrect: boolean
}

interface CodeQuizContentProps {
  quizData: QuizData
  slug: string
}

const CodeQuizContent = memo(function CodeQuizContent({ quizData, slug }: CodeQuizContentProps) {
  const { state, submitAnswer, completeQuiz, restartQuiz, isAuthenticated, nextQuestion, prevQuestion } = useQuiz()
  const router = useRouter()
  const { isAuthenticated: authState } = useAuth()
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)

  const { currentQuestionIndex, questionCount, isLoading, error, isCompleted, answers, isProcessingAuth } = state

  // Only show auth prompt after quiz completion for non-authenticated users
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isCompleted && !authState && !isProcessingAuth) {
      // Add a delay before showing the auth prompt to ensure results are calculated
      timer = setTimeout(() => {
        console.log("Quiz completed and user is not authenticated, showing auth prompt")
        setShowAuthPrompt(true)
      }, 1200) // Delay showing auth prompt to allow results to load first
    } else if (authState || isProcessingAuth) {
      // If user is authenticated or we're processing auth, don't show the prompt
      setShowAuthPrompt(false)
    }
    return () => clearTimeout(timer)
  }, [authState, isCompleted, isProcessingAuth])

  // Handle answer submission with proper state updates
  const handleAnswer = useCallback(
    (answer: string, timeSpent: number, isCorrect: boolean) => {
      console.log("Answer submitted:", { answer, timeSpent, isCorrect, currentQuestionIndex, questionCount })

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
      // Note: nextQuestion is now handled in the submitAnswer function in QuizContext
    },
    [submitAnswer, completeQuiz, currentQuestionIndex, questionCount, answers],
  )

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Error loading quiz</AlertTitle>
        <AlertDescription>
          {error || "We couldn't load the quiz data. Please try again later."}
          <div className="mt-4">
            <Button onClick={() => router.push("/dashboard/code")}>Return to Quiz Creator</Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">No questions available for this quiz.</p>
          <p className="text-sm text-muted-foreground mb-6">
            This could be because the quiz is still being generated or there was an error during creation.
          </p>
          <Button onClick={() => router.push("/dashboard/code")} className="mt-4">
            Return to Quiz Creator
          </Button>
        </CardContent>
      </Card>
    )
  }

  const currentQuestion = quizData.questions[currentQuestionIndex]

  if (!currentQuestion) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Question not found.</p>
          <p className="text-sm text-muted-foreground mb-6">There was an error loading the current question.</p>
          <Button onClick={() => router.push("/dashboard/code")} className="mt-4">
            Return to Quiz Creator
          </Button>
        </CardContent>
      </Card>
    )
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
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" aria-hidden="true"></div>
            <p className="text-sm text-muted-foreground">
              {isProcessingAuth ? "Processing your results..." : "Loading quiz data..."}
            </p>
          </motion.div>
        ) : showAuthPrompt ? (
          <motion.div
            key="auth-prompt"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.3 }}
          >
            <GuestPrompt quizId={quizData.id?.toString()} forceShow={true} />
          </motion.div>
        ) : isCompleted ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <CodeQuizResult
              title={quizData?.title || "Code Quiz"}
              onRestart={restartQuiz}
              quizId={quizData.id?.toString()}
              questions={quizData.questions}
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
            <CodingQuiz
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

interface CodeQuizWrapperProps {
  quizData: QuizData
  slug: string
  userId: string
}

export default function CodeQuizWrapper({ quizData, slug, userId }: CodeQuizWrapperProps) {
  const [isInitializing, setIsInitializing] = useState(true)
  const router = useRouter()
  const { state } = useQuiz()

  useEffect(() => {
    return () => {
      // Clean up when component unmounts if the quiz is completed
      if (state.isCompleted && state.quizId) {
        console.log("CodeQuizWrapper unmounting, cleaning up quiz data")
        quizService.cleanupAfterQuizCompletion(state.quizId, state.quizType)
      }
    }
  }, [state.isCompleted, state.quizId, state.quizType])

  useEffect(() => {
    // Short delay to allow state to initialize
    const timer = setTimeout(() => {
      setIsInitializing(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Check for returning from auth flow
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isReturningFromAuth = quizService.isReturningFromAuth()
      if (isReturningFromAuth) {
        console.log("[CodeQuizWrapper] Detected return from auth flow, processing pending data")
        quizService.processPendingQuizData().catch(console.error)
      }
    }
  }, [])

  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      if (quizData?.id) {
        console.log("Component unmounting, triggering cleanup")
        quizService.cleanupAfterQuizCompletion(quizData.id.toString(), "code")
      }
    }
  }, [quizData?.id])

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
  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
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

  // Process options to ensure no duplicates and include the correct answer
  const processedQuizData = {
    ...quizData,
    questions: quizData.questions.map((q) => {
      // Create a set of unique options
      const uniqueOptions = new Set<string>()

      // Always include the correct answer
      if (q.answer) {
        uniqueOptions.add(q.answer)
      }

      // Add other options
      if (Array.isArray(q.options)) {
        q.options.forEach((option) => {
          if (option && option.trim()) {
            uniqueOptions.add(option)
          }
        })
      }

      return {
        ...q,
        options: Array.from(uniqueOptions),
      }
    }),
  }

  return (
    <QuizProvider
      quizData={processedQuizData}
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
      <CodeQuizContent quizData={processedQuizData} slug={slug} />
    </QuizProvider>
  )
}
