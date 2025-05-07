"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"

import OpenEndedQuizQuestion from "./OpenEndedQuizQuestion"
import QuizResultsOpenEnded from "./QuizResultsOpenEnded"
import NonAuthenticatedUserSignInPrompt from "../../components/NonAuthenticatedUserSignInPrompt"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

import {
  initQuiz,
  submitAnswer,
  completeQuiz,
  resetQuiz,
  saveStateBeforeAuth,
  setRequiresAuth,
  setPendingAuthRequired,
  nextQuestion,
  restoreFromSavedState,
  clearSavedState,
} from "@/store/slices/quizSlice"
import { setIsProcessingAuth, setRedirectUrl } from "@/store/slices/authSlice"
import { Progress } from "@/components/ui/progress"
import { useAppDispatch, useAppSelector } from "@/store"

interface OpenEndedQuizWrapperProps {
  quizData: any
  slug: string
}

const ErrorDisplay = ({ error, onReturn }: { error: string; onReturn: () => void }) => {
  return (
    <Alert variant="destructive" className="animate-pulse-once">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="text-lg">Error</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-4">{error}</p>
        <div className="mt-4 flex gap-3">
          <Button onClick={onReturn} variant="default">
            Return to Quiz Creator
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

function validateInitialQuizData(quizData: any): { isValid: boolean; error?: string } {
  if (!quizData) {
    return { isValid: false, error: "Quiz data is missing" }
  }

  if (!quizData.questions || !Array.isArray(quizData.questions)) {
    return { isValid: false, error: "Questions array is missing or invalid" }
  }

  if (quizData.questions.length === 0) {
    return { isValid: false, error: "No questions found in the quiz" }
  }

  return { isValid: true }
}

export default function OpenEndedQuizWrapper({ quizData, slug }: OpenEndedQuizWrapperProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const { toast } = useToast()

  // Get auth state from Redux
  const authState = useAppSelector((state) => state.auth)
  const isAuthenticated = authState.isAuthenticated

  // Get quiz state from Redux
  const quizState = useAppSelector((state) => state.quiz)

  // Local UI state
  const [displayState, setDisplayState] = useState<"quiz" | "results" | "auth" | "loading">("loading")
  const [startTime] = useState<number>(Date.now())
  const [hasInitialized, setHasInitialized] = useState(false)
  const [isReset, setIsReset] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check URL parameters for reset
  useEffect(() => {
    const reset = searchParams?.get("reset")
    if (reset === "true") {
      // Reset the quiz state
      dispatch(resetQuiz())
      setIsReset(true)
      setDisplayState("quiz")

      // Remove the reset parameter from URL
      if (typeof window !== "undefined") {
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete("reset")
        newUrl.searchParams.delete("t") // Remove timestamp parameter too
        window.history.replaceState({}, "", newUrl.toString())
      }
    }
  }, [searchParams, dispatch])

  // Initialize quiz with Redux
  useEffect(() => {
    if (hasInitialized && !isReset) return

    if (!quizData) {
      setError("Quiz data is missing or invalid")
      return
    }

    const validation = validateInitialQuizData(quizData)
    if (!validation.isValid) {
      setError(validation.error || "Invalid quiz data")
      return
    }

    // Validate quiz data
    if (!quizData || !quizData.questions || !Array.isArray(quizData.questions)) {
      toast({
        title: "Error loading quiz",
        description: "The quiz data is invalid or missing. Please try again.",
        variant: "destructive",
      })
      return
    }

    // Initialize quiz data in Redux
    dispatch(
      initQuiz({
        quizId: quizData.id || quizData.quizId || "unknown",
        slug: slug || "unknown",
        title: quizData.title || "Open Ended Quiz",
        quizType: "openended",
        questions: quizData.questions || [],
        isCompleted: false,
        score: 0,
        requiresAuth: true, // Always require auth to see results
      }),
    )

    setHasInitialized(true)
    setIsReset(false)

    // Set display state to quiz after initialization
    setTimeout(() => {
      setDisplayState("quiz")
    }, 500)
  }, [quizData, slug, dispatch, toast, hasInitialized, isReset])

  // Check URL parameters for auth return
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const fromAuth = urlParams.get("fromAuth") === "true"

      if (fromAuth && isAuthenticated) {
        // If we have saved state, restore it
        if (quizState.savedState) {
          dispatch(restoreFromSavedState())

          // Force the quiz to completed state if it was completed before
          if (quizState.savedState.isCompleted) {
            dispatch(
              completeQuiz({
                answers: quizState.savedState.answers || [],
                score: quizState.savedState.score || 0,
                completedAt: quizState.savedState.completedAt || new Date().toISOString(),
              }),
            )
          }
        }

        // Show results
        setDisplayState("results")

        // Clean up URL parameters
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete("fromAuth")
        window.history.replaceState({}, "", newUrl.toString())

        // Clean up the saved state
        dispatch(clearSavedState())
      }
    }
  }, [isAuthenticated, dispatch, quizState.savedState])

  // Update display state based on quiz state
  useEffect(() => {
    if (quizState.isSavingResults) {
      setDisplayState("loading")
      return
    }

    if (quizState.isCompleted) {
      if (isAuthenticated) {
        setDisplayState("results")
      } else {
        setDisplayState("auth")
      }
      return
    }

    if (displayState === "loading" && !quizState.isSavingResults && hasInitialized) {
      setDisplayState("quiz")
    }
  }, [quizState.isCompleted, quizState.isSavingResults, isAuthenticated, displayState, hasInitialized])

  // Handle answer submission
  const handleAnswer = (answer: string) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)

    // For open-ended questions, we can simulate a similarity score
    // In a real app, this would be calculated by comparing to model answers
    const currentQuestion = quizState.questions[quizState.currentQuestionIndex]
    const modelAnswer = currentQuestion.modelAnswer || currentQuestion.answer || ""

    // Simple similarity calculation (in a real app, use NLP or AI for this)
    let similarity = 85 // Default reasonable similarity

    // If we have a model answer, do a basic length comparison
    if (modelAnswer && answer) {
      // Very basic similarity - just comparing lengths as a demo
      // In a real app, use proper text comparison algorithms
      const lengthRatio = Math.min(answer.length, modelAnswer.length) / Math.max(answer.length, modelAnswer.length)
      similarity = Math.round(lengthRatio * 100)

      // Ensure minimum similarity of 50% for demo purposes
      similarity = Math.max(similarity, 50)
    }

    // Submit answer to Redux
    dispatch(
      submitAnswer({
        answer,
        userAnswer: answer,
        timeSpent,
        isCorrect: true, // For open-ended, we don't have a strict correct/incorrect
        similarity, // Add the similarity score
      }),
    )

    // If this is the last question, complete the quiz
    if (quizState.currentQuestionIndex >= quizState.questions.length - 1) {
      // Complete the quiz with all answers
      const allAnswers = [
        ...quizState.answers,
        {
          answer,
          userAnswer: answer,
          timeSpent,
          isCorrect: true,
          similarity,
        },
      ].filter(Boolean)

      dispatch(
        completeQuiz({
          answers: allAnswers,
          score: 100, // For open-ended, we might not have a specific score
          completedAt: new Date().toISOString(),
        }),
      )
    } else {
      // Move to next question
      setTimeout(() => {
        dispatch(nextQuestion())
      }, 500)
    }
  }

  // Handle restart quiz
  const handleRestartQuiz = () => {
    dispatch(resetQuiz())
    setDisplayState("quiz")

    toast({
      title: "Quiz restarted",
      description: "You can now retake the quiz. Sign in to save your results.",
      variant: "default",
    })
  }

  // Handle sign in
  const handleSignIn = () => {
    // Create the redirect URL
    const redirectUrl = `/dashboard/openended/${slug}?fromAuth=true`

    // Save current state before auth
    dispatch(
      saveStateBeforeAuth({
        quizId: quizState.quizId,
        slug,
        quizType: "openended",
        currentQuestionIndex: quizState.currentQuestionIndex,
        answers: quizState.answers,
        isCompleted: true,
        score: quizState.score,
        completedAt: new Date().toISOString(),
      }),
    )

    // Set auth flags
    dispatch(setRequiresAuth(true))
    dispatch(setPendingAuthRequired(true))
    dispatch(setIsProcessingAuth(true))
    dispatch(setRedirectUrl(redirectUrl))

    // Redirect to sign-in
    router.push(`/api/auth/signin?callbackUrl=${encodeURIComponent(redirectUrl)}`)
  }

  // Handle continue as guest
  const handleContinueAsGuest = () => {
    setDisplayState("results")
  }

  // Handle declined authentication
  const handleDeclinedAuth = () => {
    // Reset the quiz
    dispatch(resetQuiz())

    // Reset display state
    setDisplayState("quiz")

    // Clear saved state
    dispatch(clearSavedState())

    // Show toast
    toast({
      title: "Quiz reset",
      description: "You can now start the quiz again from the beginning.",
      variant: "default",
    })
  }

  if (error) {
    return <ErrorDisplay error={`Error loading quiz: ${error}`} onReturn={() => router.push("/dashboard/quizzes")} />
  }

  // Error state
  if (quizState.error) {
    return (
      <Alert variant="destructive" className="animate-pulse-once">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle className="text-lg">Error loading quiz</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4">{quizState.error}</p>
          <div className="mt-4 flex gap-3">
            <Button onClick={() => router.push("/dashboard/openended")} variant="default">
              Return to Quiz Creator
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Loading state
  if (displayState === "loading" || !hasInitialized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-center text-muted-foreground">Loading quiz...</p>
        <Progress value={30} className="w-full max-w-md mx-auto mt-2" />
      </div>
    )
  }

  // Auth prompt
  if (displayState === "auth") {
    return (
      <NonAuthenticatedUserSignInPrompt
        onSignIn={handleSignIn}
        onContinueAsGuest={handleContinueAsGuest}
        quizType="open-ended quiz"
      />
    )
  }

  // Results
  if (displayState === "results") {
    return (
      <QuizResultsOpenEnded
        quizId={quizState.quizId || "unknown"}
        slug={slug || "unknown"}
        title={quizState.title || quizData.title || ""}
        answers={quizState.answers.filter(Boolean)}
        questions={quizState.questions}
        totalQuestions={quizState.questions.length}
        startTime={startTime}
        score={quizState.score}
        onRestart={handleRestartQuiz}
        onSignIn={handleSignIn}
      />
    )
  }

  // Quiz
  // Ensure we have questions before trying to access them
  if (!quizState.questions || quizState.questions.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>No questions found</AlertTitle>
        <AlertDescription>
          <p>This quiz doesn't have any questions. Please try another quiz or create a new one.</p>
          <Button onClick={() => router.push("/dashboard/openended")} className="mt-4">
            Return to Quiz Creator
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  const currentQuestionData = quizState.questions[quizState.currentQuestionIndex]
  const totalQuestions = quizState.questions.length
  const currentQuestionIndex = quizState.currentQuestionIndex

  // Calculate progress percentage safely
  const progressPercentage = totalQuestions > 0 ? Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100) : 0

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Quiz Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <span>{progressPercentage}% Complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      {currentQuestionData && (
        <OpenEndedQuizQuestion
          question={currentQuestionData}
          onAnswer={handleAnswer}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={totalQuestions}
        />
      )}
    </div>
  )
}
