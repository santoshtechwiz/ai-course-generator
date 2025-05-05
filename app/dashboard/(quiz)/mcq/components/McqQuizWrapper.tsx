"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import McqQuiz from "./McqQuiz"
import McqQuizResult from "./McqQuizResult"
import { Card } from "@/components/ui/card"
import { Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useQuiz } from "@/app/context/QuizContext"
import NonAuthenticatedUserSignInPrompt from "../../components/NonAuthenticatedUserSignInPrompt"
import {
  createQuizError,
  QuizErrorType,
  getUserFriendlyErrorMessage,

  formatQuizTime,
  calculateTotalTime,
} from "@/lib/utils/quiz-index"
import { useAppDispatch, useAppSelector } from "@/store"
import { useToast } from "@/hooks/use-toast"
import { setRequiresAuth, setPendingAuthRequired, saveStateBeforeAuth, resetQuiz } from "@/store/slices/quizSlice"
import { setIsProcessingAuth } from "@/store/slices/authSlice"
import { Progress } from "@/components/ui/progress"
import { quizUtils } from "@/lib/utils/quiz-utils"

// Debug component for state visualization
const StateDebugger = ({ state, title = "State Debug" }: { state: any; title?: string }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (process.env.NODE_ENV !== "development" || process.env.NEXT_PUBLIC_DEBUG_MODE !== "true") {
    return null
  }

  return (
    <Card className="bg-slate-50 border-slate-200 mb-4">
      <div className="p-3">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <h3 className="text-sm text-slate-700 font-medium">{title}</h3>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            {isExpanded ? "−" : "+"}
          </Button>
        </div>
        {isExpanded && (
          <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-60 mt-2">
            {JSON.stringify(state, null, 2)}
          </pre>
        )}
      </div>
    </Card>
  )
}

interface McqQuizWrapperProps {
  quizData?: any
  questions?: any[]
  quizId?: string
  slug: string
  error?: any
  quizResults?: any
  currentQuestionIndex?: number
  showResults?: boolean
}

/**
 * McqQuizWrapper - Handles the display and state management for MCQ quizzes
 */
export default function McqQuizWrapper({
  quizData,
  questions,
  quizId,
  slug,
  error: propError,
  quizResults: propQuizResults,
  currentQuestionIndex: propCurrentQuestionIndex,
  showResults: propShowResults,
}: McqQuizWrapperProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(propCurrentQuestionIndex || 0)
  const [answers, setAnswers] = useState<any[]>([])
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<any>(propError || null)
  const [showResults, setShowResults] = useState(propShowResults || false)
  const [quizResults, setQuizResults] = useState<any>(propQuizResults || null)
  const [startTime] = useState<number>(Date.now())
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isReset, setIsReset] = useState(false)

  // Use the quiz context for state management
  const {
    state: contextState,
    authState,
    submitAnswer: submitQuizAnswer,
    completeQuiz,
    handleAuthenticationRequired,
    setAuthCheckComplete,
    restoreFromSavedState,
    restartQuiz,
  } = useQuiz()

  // Get Redux state
  const quizReduxState = useAppSelector((state) => state.quiz)
  const authReduxState = useAppSelector((state) => state.auth)

  // Use context state if available, otherwise use Redux state
  const state = contextState || quizReduxState
  const isAuthenticated = authReduxState.isAuthenticated

  // Check for reset parameter
  useEffect(() => {
    const reset = searchParams?.get("reset")
    if (reset === "true") {
      // Reset the quiz state
      dispatch(resetQuiz())

      // Reset local state
      setCurrentQuestionIndex(0)
      setAnswers([])
      setShowResults(false)
      setQuizResults(null)
      setIsReset(true)

      // Remove the reset parameter from URL
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("reset")
      newUrl.searchParams.delete("t") // Remove timestamp parameter too
      window.history.replaceState({}, "", newUrl.toString())
    }
  }, [searchParams, dispatch])

  // Get questions from props or context
  const quizQuestions = useMemo(() => {
    return questions || quizData?.questions || state?.questions || []
  }, [questions, quizData, state])

  // Initialize answers array on component mount
  useEffect(() => {
    if (quizQuestions && Array.isArray(quizQuestions) && quizQuestions.length > 0) {
      // Only initialize answers if they're not already set or if we're resetting
      if (answers.length === 0 || isReset) {
        setAnswers(Array(quizQuestions.length).fill(null))
        setIsReset(false)
      }
      setIsLoading(false)
    } else {
      // Set a timeout to stop showing loading state if questions don't load
      const timer = setTimeout(() => setIsLoading(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [quizQuestions, answers.length, isReset])

  // Check if we should show results when state changes
  useEffect(() => {
    // Only show results if not in reset mode
    if (state.isCompleted && isAuthenticated && !isReset) {
      setShowResults(true)
    }
  }, [state, isAuthenticated, isReset])

  // Check for URL parameters that indicate returning from auth
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const fromAuth = urlParams.get("fromAuth")

      if (fromAuth === "true") {
        // Set loading state while we restore
        setIsLoading(true)

        // Restore state from Redux
        if (restoreFromSavedState) {
          restoreFromSavedState()
        }

        if (typeof setAuthCheckComplete === "function") {
          setAuthCheckComplete(true)
        }

        // Force show results
        setShowResults(true)

        // Force isCompleted in local state
        if (state.savedState) {
          // Create quiz results from saved state
          const savedAnswers = state.savedState.answers || []
          const correctAnswers = savedAnswers.filter((a: any) => a && a.isCorrect).length
          const totalQuestions = savedAnswers.length

          setQuizResults({
            quizId: state.savedState.quizId || quizId || "",
            slug: state.savedState.slug || slug,
            score: state.savedState.score || 0,
            totalQuestions,
            correctAnswers,
            answers: savedAnswers,
            completedAt: state.savedState.completedAt || new Date().toISOString(),
          })
        }

        // Clear the fromAuth parameter
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete("fromAuth")
        window.history.replaceState({}, "", newUrl.toString())

        // End loading state
        setIsLoading(false)
      }
    }
  }, [state, setAuthCheckComplete, restoreFromSavedState, quizId, slug])

  // Handle result saving notification
  useEffect(() => {
    if (state.isCompleted && isAuthenticated && !state.resultsSaved) {
      toast({
        title: "Quiz completed!",
        description: "Your results have been saved.",
      })
    }
  }, [state, isAuthenticated, toast])

  // Set quiz results from props if provided
  useEffect(() => {
    if (propQuizResults && !quizResults && !isReset) {
      setQuizResults(propQuizResults)
      setShowResults(true)
    }
  }, [propQuizResults, quizResults, isReset])

  // Set error from props if provided
  useEffect(() => {
    if (propError && !error) {
      setError(propError)
    }
  }, [propError, error])

  // Set current question index from props if provided
  useEffect(() => {
    if (propCurrentQuestionIndex !== undefined && !isReset) {
      setCurrentQuestionIndex(propCurrentQuestionIndex)
    }
  }, [propCurrentQuestionIndex, isReset])

  // Set show results from props if provided
  useEffect(() => {
    if (propShowResults !== undefined && !isReset) {
      setShowResults(propShowResults)
    }
  }, [propShowResults, isReset])

  // Memoize the current question to prevent unnecessary re-renders
  const currentQuestion = useMemo(() => {
    return quizQuestions[currentQuestionIndex]
  }, [quizQuestions, currentQuestionIndex])

  const isLastQuestion = currentQuestionIndex === (quizQuestions?.length ?? 0) - 1

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (!quizQuestions || quizQuestions.length === 0) return 0
    return Math.round(((currentQuestionIndex + 1) / quizQuestions.length) * 100)
  }, [currentQuestionIndex, quizQuestions])

  // Handle answer selection
  const handleAnswer = useCallback(
    (selectedOption: string, timeSpent: number, isCorrect: boolean) => {
      try {
        if (isCompleting || !submitQuizAnswer) return

        // Create answer object
        const answer = {
          questionId: currentQuestion?.id || currentQuestionIndex,
          question: currentQuestion?.question,
          selectedOption,
          correctOption: currentQuestion?.answer,
          isCorrect,
          timeSpent,
          index: currentQuestionIndex,
        }

        // Update local state
        const newAnswers = [...answers]
        newAnswers[currentQuestionIndex] = answer
        setAnswers(newAnswers)

        // Submit answer to Redux
        submitQuizAnswer({
          answer: selectedOption,
          userAnswer: selectedOption,
          isCorrect,
          timeSpent,
          questionId: currentQuestion?.id || currentQuestionIndex,
          index: currentQuestionIndex,
        })

        // Move to the next question or complete the quiz
        if (isLastQuestion) {
          handleQuizCompletion(newAnswers)
        } else {
          setCurrentQuestionIndex((prev) => prev + 1)
        }
      } catch (err) {
        console.error("Error handling answer:", err)
        setError(createQuizError(QuizErrorType.UNKNOWN, "Failed to process your answer. Please try again.", err, true))
      }
    },
    [isCompleting, submitQuizAnswer, currentQuestion, currentQuestionIndex, isLastQuestion, answers],
  )

  // Handle quiz completion
  const handleQuizCompletion = useCallback(
    async (finalAnswers: any[]) => {
      if (isCompleting || !completeQuiz) return

      setIsCompleting(true)

      try {
        const answersArray = Array.isArray(finalAnswers) ? finalAnswers : []

        // Calculate score
        const correctAnswers = answersArray.filter((a) => a && a.isCorrect).length
        const totalQuestions = quizQuestions?.length || 0
        const score = quizUtils.calculateScore
          ? quizUtils.calculateScore(
              answersArray.map((a) =>
                a
                  ? {
                      answer: a.selectedOption,
                      isCorrect: a.isCorrect,
                      timeSpent: a.timeSpent,
                    }
                  : { answer: "", isCorrect: false, timeSpent: 0 },
              ),
              "mcq",
            )
          : Math.round((correctAnswers / totalQuestions) * 100)

        // Calculate total time
        const totalTimeSpent = calculateTotalTime(answersArray.filter(Boolean))
        const formattedTimeSpent = formatQuizTime(totalTimeSpent)

        // Prepare result data
        const resultQuizId = quizId || state?.quizId || "test-quiz"
        const quizResult = {
          quizId: resultQuizId,
          slug,
          answers: answersArray,
          score,
          totalQuestions,
          correctAnswers,
          totalTimeSpent,
          formattedTimeSpent,
          completedAt: new Date().toISOString(),
          elapsedTime: Math.floor((Date.now() - startTime) / 1000),
        }

        setQuizResults(quizResult)

        // Complete the quiz in Redux
        await completeQuiz({
          answers: answersArray.map((a) =>
            a
              ? {
                  answer: a.selectedOption,
                  userAnswer: a.selectedOption,
                  isCorrect: a.isCorrect,
                  timeSpent: a.timeSpent,
                  questionId: a.questionId,
                }
              : null,
          ),
          score,
          completedAt: new Date().toISOString(),
        })

        // If the user is authenticated, show results immediately
        if (isAuthenticated) {
          setShowResults(true)
        }
      } catch (err) {
        console.error("Error completing quiz:", err)
        setError(createQuizError(QuizErrorType.UNKNOWN, "Failed to complete the quiz. Please try again.", err, true))
      } finally {
        setIsCompleting(false)
      }
    },
    [isCompleting, completeQuiz, quizQuestions, slug, startTime, isAuthenticated, quizId, state?.quizId],
  )

  // Handle continuing as non-authenticated user
  const handleContinueAsNonAuthenticatedUser = useCallback(() => {
    setShowResults(true)
  }, [])

  // Handle sign in
  const handleSignIn = useCallback(() => {
    if (handleAuthenticationRequired) {
      // First set loading state to prevent flashing content
      setIsLoading(true)

      // Store current state in Redux
      dispatch(
        saveStateBeforeAuth({
          quizId,
          slug,
          quizType: "mcq",
          currentQuestionIndex,
          answers,
          isCompleted: true, // Force isCompleted to true
          score: quizResults?.score || 0,
          completedAt: new Date().toISOString(),
        }),
      )

      // Set all required flags
      dispatch(setRequiresAuth(true))
      dispatch(setPendingAuthRequired(true))
      dispatch(setIsProcessingAuth(true))

      // Use a small timeout to ensure Redux state is updated before redirect
      setTimeout(() => {
        // Redirect to sign-in
        handleAuthenticationRequired(`/dashboard/mcq/${slug}?fromAuth=true`)
      }, 50)
    }
  }, [
    handleAuthenticationRequired,
    slug,
    dispatch,
    quizId,
    currentQuestionIndex,
    answers,
    quizResults?.score,
    setIsLoading,
  ])

  // If there's an error, show the error message
  if (error) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center gap-4">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <h3 className="text-xl font-semibold">Error Loading Quiz</h3>
          <p className="text-muted-foreground">{getUserFriendlyErrorMessage(error)}</p>
          <Button onClick={() => router.push("/dashboard/mcq")}>Return to Quiz List</Button>
        </div>
      </Card>
    )
  }

  // If the quiz is completed and the user is not authenticated, show the non-authenticated user sign-in prompt
  if ((state.isCompleted || quizResults) && !isAuthenticated && !authReduxState.isProcessingAuth && !isReset) {
    return (
      <NonAuthenticatedUserSignInPrompt
        onContinueAsNonAuthenticatedUser={handleContinueAsNonAuthenticatedUser}
        onSignIn={handleSignIn}
        quizType="quiz"
        showSaveMessage={true}
      />
    )
  }

  // If the quiz is completed and results are available, show the results
  if (showResults && quizResults && !isReset) {
    return (
      <McqQuizResult
        result={
          quizResults || {
            quizId: quizId || state?.quizId || "test-quiz",
            slug,
            score: state.score || 0,
            answers: state.answers || [],
            totalQuestions: quizQuestions?.length || 0,
            correctAnswers: (state.answers || []).filter((a: any) => a && a.isCorrect).length,
            completedAt: state.completedAt || new Date().toISOString(),
          }
        }
      />
    )
  }

  // If there's no current question and we're not showing results, show a loading indicator
  if (isLoading || (!currentQuestion && !showResults)) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-center text-muted-foreground">Loading quiz questions...</p>
          <Progress value={30} className="w-full max-w-md mx-auto mt-2" />
        </div>
      </Card>
    )
  }

  // Otherwise, show the quiz
  return (
    <div className="space-y-6">
      {process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEBUG_MODE === "true" && (
        <>
          <StateDebugger state={state} title="Quiz Redux State" />
          <StateDebugger state={authReduxState} title="Auth Redux State" />
          <StateDebugger
            state={{
              localState: {
                currentQuestionIndex,
                showResults,
                isCompleting,
                answersCount: answers.length,
                quizResultsExists: !!quizResults,
                isReset,
              },
              sessionStatus: status,
              isAuthenticated: !!session?.user,
              currentQuestion: currentQuestion
                ? {
                    id: currentQuestion.id,
                    question: currentQuestion.question,
                  }
                : null,
            }}
            title="Component State"
          />
        </>
      )}

      {/* Quiz Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-muted-foreground mb-1">
          <span>
            Question {currentQuestionIndex + 1} of {quizQuestions.length}
          </span>
          <span>{progressPercentage}% Complete</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      <McqQuiz
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={quizQuestions?.length || 0}
        isLastQuestion={isLastQuestion}
      />

      {isCompleting && (
        <Card className="p-4 mt-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
            <p>Submitting your answers...</p>
          </div>
        </Card>
      )}
    </div>
  )
}
