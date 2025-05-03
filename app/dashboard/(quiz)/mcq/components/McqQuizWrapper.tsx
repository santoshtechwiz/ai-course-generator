"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import McqQuiz from "./McqQuiz"
import McqQuizResult from "./McqQuizResult"
import { Card } from "@/components/ui/card"
import { Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useQuiz } from "@/app/context/QuizContext"
// Import from the central quiz-index file
import {
  createQuizError,
  QuizErrorType,
  getUserFriendlyErrorMessage,
  quizUtils,
  formatQuizTime,
  calculateTotalTime,
} from "@/lib/utils/quiz-index"
import React from "react"
import { useSelector } from "react-redux"
import { useToast } from "@/hooks/use-toast"

/**
 * McqQuizWrapper - Handles the display and state management for MCQ quizzes
 *
 * @param {Object} props - Component props
 * @param {Array} props.questions - Array of quiz questions
 * @param {string} props.quizId - ID of the quiz
 * @param {string} props.slug - URL slug for the quiz
 * @param {Object} props.quizData - Additional quiz data (optional)
 */
export default function McqQuizWrapper({ questions, quizId, slug, quizData }: any) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)
  const [quizResults, setQuizResults] = useState<any>(null)
  const [startTime] = useState<number>(Date.now())
  const router = useRouter()
  const { toast } = useToast()

  // Use the quiz context for state management
  const {
    state: contextState,
    submitAnswer: submitQuizAnswer,
    completeQuiz,
    handleAuthenticationRequired,
    setAuthCheckComplete,
  } = useQuiz()

  // Fallback to Redux state if context state is undefined
  const reduxState = useSelector((state: any) => state.quiz)

  // Use context state if available, otherwise use Redux state
  const state = contextState || reduxState

  // Safety check - if neither state source is available, provide default values
  const safeState = state || {
    isCompleted: false,
    isAuthenticated: false,
    requiresAuth: false,
    isProcessingAuth: false,
    pendingAuthRequired: false,
    resultsSaved: false,
  }

  // Initialize answers array on component mount
  useEffect(() => {
    if (questions && Array.isArray(questions)) {
      // Initialize answers array with nulls
      setAnswers(Array(questions.length).fill(null))
    }
  }, [questions])

  // Validate and prepare questions on component mount
  useEffect(() => {
    try {
      if (!questions) {
        const error = createQuizError(QuizErrorType.VALIDATION, "No questions available for this quiz.", null, false)
        setError(error)
        return
      }

      if (!Array.isArray(questions)) {
        const error = createQuizError(QuizErrorType.VALIDATION, "Questions data is invalid.", null, false)
        setError(error)
        return
      }

      if (questions.length === 0) {
        const error = createQuizError(QuizErrorType.VALIDATION, "No questions available for this quiz.", null, false)
        setError(error)
        return
      }

      // Check if questions have the required fields
      const invalidQuestions = questions.filter((q) => !q || !q.question || !q.answer)

      if (invalidQuestions.length > 0) {
        console.error("Invalid questions found:", invalidQuestions)
        const error = createQuizError(
          QuizErrorType.VALIDATION,
          "Some questions in this quiz are invalid. Please try another quiz.",
          invalidQuestions,
          false,
        )
        setError(error)
      }
    } catch (err) {
      console.error("Error initializing quiz:", err)
      const error = createQuizError(QuizErrorType.UNKNOWN, "Failed to initialize quiz. Please try again.", err, true)
      setError(error)
    }
  }, [questions])

  // Check if we should show results when state changes
  useEffect(() => {
    // Only run this effect if state is available
    if (!safeState) return

    if (safeState.isCompleted) {
      if (safeState.isAuthenticated) {
        setShowResults(true)
      } else if (safeState.requiresAuth && !safeState.isProcessingAuth) {
        // If auth is required but user is not authenticated and not currently processing auth
        if (typeof handleAuthenticationRequired === "function") {
          handleAuthenticationRequired(`/dashboard/mcq/${slug}?fromAuth=true`)
        }
      }
    }
  }, [safeState, slug, handleAuthenticationRequired])

  // Check for URL parameters that indicate returning from auth
  useEffect(() => {
    // Only run this effect once on mount and if state is available
    if (!safeState) return

    const checkFromAuth = () => {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search)
        const fromAuth = urlParams.get("fromAuth")

        if (fromAuth === "true" && safeState.isCompleted && safeState.pendingAuthRequired) {
          // User has returned from authentication
          if (typeof setAuthCheckComplete === "function") {
            setAuthCheckComplete()
          }
          setShowResults(true)
        }
      }
    }

    checkFromAuth()
  }, [safeState, setAuthCheckComplete])

  // Inside the component function, add this effect to handle result saving
  useEffect(() => {
    // If the quiz is completed and the user is authenticated, ensure results are saved
    const shouldSaveResults = safeState.isCompleted && safeState.isAuthenticated && !safeState.resultsSaved

    if (shouldSaveResults) {
      // The submitQuizResults action should be dispatched in the completeQuiz function
      // This is just a safety check to ensure results are saved
      toast({
        title: "Quiz completed!",
        description: "Your results have been saved.",
      })
    }
  }, [safeState, toast])

  // Memoize the current question to prevent unnecessary re-renders
  const currentQuestion = React.useMemo(() => {
    return questions?.[currentQuestionIndex]
  }, [questions, currentQuestionIndex])

  const isLastQuestion = currentQuestionIndex === (questions?.length ?? 0) - 1

  const handleAnswer = useCallback(
    (selectedOption: string, timeSpent: number, isCorrect: boolean) => {
      try {
        // Prevent duplicate submissions or if no context available
        if (isCompleting || !submitQuizAnswer) return

        // Create answer object
        const answer = {
          questionId: currentQuestion?.id || currentQuestionIndex,
          question: currentQuestion?.question,
          selectedOption,
          correctOption: currentQuestion?.answer,
          isCorrect,
          timeSpent,
          index: currentQuestionIndex, // Add index to ensure correct placement in array
        }

        // Update local state
        const newAnswers = [...answers]
        newAnswers[currentQuestionIndex] = answer
        setAnswers(newAnswers)

        // Submit answer to Redux with index to ensure correct placement
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
        const error = createQuizError(
          QuizErrorType.UNKNOWN,
          "Failed to process your answer. Please try again.",
          err,
          true,
        )
        setError(error)
      }
    },
    [isCompleting, submitQuizAnswer, currentQuestion, currentQuestionIndex, isLastQuestion, answers],
  )

  const handleQuizCompletion = useCallback(
    async (finalAnswers: any[]) => {
      // Return early if we're already completing or if completeQuiz is not available
      if (isCompleting || !completeQuiz) return

      setIsCompleting(true)

      try {
        // Ensure finalAnswers is an array
        const answersArray = Array.isArray(finalAnswers) ? finalAnswers : []

        // Calculate score using the utility function
        const correctAnswers = answersArray.filter((a) => a && a.isCorrect).length
        const totalQuestions = questions?.length || 0
        const score = quizUtils.calculateScore(
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

        // Calculate total time spent using the utility function
        const totalTimeSpent = calculateTotalTime(answersArray.filter(Boolean))
        const formattedTimeSpent = formatQuizTime(totalTimeSpent)

        // Prepare result data
        const quizResult = {
          quizId,
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

        // Save results to state
        setQuizResults(quizResult)

        // Complete the quiz in Redux - Ensure we pass a properly formatted array
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
        if (safeState.isAuthenticated) {
          setShowResults(true)
          console.log("Quiz results saved to database for authenticated user")
        }
      } catch (err) {
        console.error("Error completing quiz:", err)
        const error = createQuizError(
          QuizErrorType.UNKNOWN,
          "Failed to complete the quiz. Please try again.",
          err,
          true,
        )
        setError(error)
      } finally {
        setIsCompleting(false)
      }
    },
    [isCompleting, completeQuiz, questions, quizId, slug, startTime, safeState.isAuthenticated],
  )

  // If no state is available, show a loading indicator
  if (!safeState) {
    return (
      <Card className="p-6 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p>Loading quiz state...</p>
      </Card>
    )
  }

  let content

  if (error) {
    content = (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center gap-4">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <h3 className="text-xl font-semibold">Error Loading Quiz</h3>
          <p className="text-muted-foreground">{getUserFriendlyErrorMessage(error)}</p>
          <Button onClick={() => router.push("/dashboard/mcq")}>Return to Quiz List</Button>
        </div>
      </Card>
    )
  } else if (!currentQuestion && !showResults) {
    content = (
      <Card className="p-6 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p>Loading questions...</p>
      </Card>
    )
  } else if (
    safeState.isCompleted &&
    safeState.requiresAuth &&
    !safeState.isAuthenticated &&
    !safeState.isProcessingAuth
  ) {
    content = (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center gap-4">
          <h3 className="text-xl font-semibold">Sign In to Save Results</h3>
          <p className="text-muted-foreground">You need to sign in to save your quiz results.</p>
          <div className="flex gap-4">
            <Button
              onClick={() => handleAuthenticationRequired?.(`/dashboard/mcq/${slug}?fromAuth=true`)}
              variant="default"
            >
              Sign In
            </Button>
            <Button onClick={() => router.push("/dashboard/mcq")} variant="outline">
              Return to Quizzes
            </Button>
          </div>
        </div>
      </Card>
    )
  } else if (showResults && quizResults) {
    content = <McqQuizResult result={quizResults} />
  } else {
    content = (
      <div className="space-y-6">
        {process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEBUG_MODE === "true" && (
          <Card className="bg-slate-50 border-slate-200">
            <div className="p-3">
              <h3 className="text-sm text-slate-700">Quiz State Debug</h3>
              <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-60 mt-2">
                {JSON.stringify(safeState, null, 2)}
              </pre>
            </div>
          </Card>
        )}

        <McqQuiz
          question={currentQuestion}
          onAnswer={handleAnswer}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions?.length || 0}
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

  return <>{content}</>
}
