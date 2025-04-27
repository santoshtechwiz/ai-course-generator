"use client"

import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { AlertCircle } from "lucide-react"

import OpenEndedQuizQuestion from "./OpenEndedQuizQuestion"
import QuizResultsOpenEnded from "./QuizResultsOpenEnded"
import { GuestPrompt } from "../../components/GuestSignInPrompt"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { QuizProvider, useQuiz } from "@/app/context/QuizContext"
import { quizService } from "@/lib/quiz-service"
import { useEffect, useState } from "react"
import { useAuth } from "@/providers/unified-auth-provider"

interface OpenEndedQuizWrapperProps {
  quizData: any
  slug: string
}

// This is the main wrapper that uses the provider
export default function OpenEndedQuizWrapper({ quizData, slug }: OpenEndedQuizWrapperProps) {
  return (
    <QuizProvider
      quizData={quizData}
      slug={slug}
      onAuthRequired={(redirectUrl) => {
        // Handle authentication prompt here
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
      <OpenEndedQuizContent quizData={quizData} slug={slug} />
    </QuizProvider>
  )
}

// This component consumes the context
function OpenEndedQuizContent({ quizData, slug }: { quizData: any; slug: string }) {
  const router = useRouter()
  const { state, submitAnswer, completeQuiz, restartQuiz, isAuthenticated } = useQuiz()

  const { isAuthenticated: authState } = useAuth()
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)

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
  } = state

  // Check if we should show the auth prompt for non-authenticated users
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (!authState && isCompleted && !isLoading && !isProcessingAuth) {
      // Add a delay before showing the auth prompt to ensure results are calculated
      timer = setTimeout(() => {
        console.log("User is not authenticated and quiz is completed, showing auth prompt")
        setShowAuthPrompt(true)
      }, 1200) // Delay showing auth prompt to allow results to load first
    } else {
      setShowAuthPrompt(false)
    }
    return () => clearTimeout(timer)
  }, [authState, isCompleted, isLoading, isProcessingAuth])

  // Get current question data
  const currentQuestionData = quizData?.questions?.[currentQuestionIndex] || null

  // Handle answer submission
  const handleAnswer = (answer: string) => {
    // Calculate time spent on this question
    const timeSpent = (Date.now() - state.startTime) / 1000
    const hintsUsed = false // You can implement hint tracking if needed

    // Create answer object
    const answerObj = {
      answer,
      timeSpent,
      isCorrect: true, // For open-ended questions, we don't have a strict correct/incorrect
      hintsUsed,
    }

    // Submit answer
    submitAnswer(answer, timeSpent, true)

    // If this is the last question, complete the quiz
    if (currentQuestionIndex >= questionCount - 1) {
      const finalAnswers = [...answers.slice(0, currentQuestionIndex), answerObj]
      completeQuiz(finalAnswers)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4">
        <div className="space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <div className="flex justify-between">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="w-full max-w-3xl mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading quiz</AlertTitle>
          <AlertDescription>
            {error || "We couldn't load the quiz data. Please try again later."}
            <div className="mt-4">
              <Button onClick={() => router.push("/dashboard/openended")}>Return to Quiz Creator</Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {isLoading || isProcessingAuth ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-[200px] gap-3 py-8"
          >
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">
              {isProcessingAuth ? "Processing your results..." : "Loading quiz data..."}
            </p>
          </motion.div>
        ) : isCompleted && showAuthPrompt && !isAuthenticated ? (
          <motion.div
            key="auth-prompt"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.3 }}
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
            <QuizResultsOpenEnded
              quizId={quizId}
              slug={slug}
              title={title || quizData.title || ""}
              answers={answers}
              questions={quizData.questions}
              totalQuestions={questionCount}
              startTime={state.startTime}
              score={score}
              onRestart={restartQuiz}
              onSignIn={() => {
                console.log("Sign in clicked")
              }}
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
