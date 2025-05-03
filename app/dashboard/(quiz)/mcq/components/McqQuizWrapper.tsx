"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import McqQuiz from "./McqQuiz"
import McqQuizResult from "./McqQuizResult"
import { Card } from "@/components/ui/card"
import { Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useQuiz } from "@/app/context/QuizContext"
import { createQuizError, QuizErrorType, getUserFriendlyErrorMessage } from "@/lib/utils/quiz-error-handling"
import { quizUtils } from "@/lib/utils/quiz-utils"
import { formatQuizTime } from "@/lib/utils/quiz-performance"

export default function McqQuizWrapper({ questions, quizId, slug }: any) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<any>(null)
  const [showResults, setShowResults] = useState(false)
  const [quizResults, setQuizResults] = useState<any>(null)
  const [startTime] = useState<number>(Date.now())
  const router = useRouter()

  // Use the quiz context for state management
  const { state, submitAnswer: submitQuizAnswer, completeQuiz, handleAuthenticationRequired } = useQuiz()

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
    if (state.isCompleted && !state.requiresAuth) {
      setShowResults(true)
    }
  }, [state.isCompleted, state.requiresAuth])

  const currentQuestion = questions?.[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === (questions?.length ?? 0) - 1

  const handleAnswer = (selectedOption: string, timeSpent: number, isCorrect: boolean) => {
    try {
      // Create answer object
      const answer = {
        questionId: currentQuestion?.id || currentQuestionIndex,
        question: currentQuestion?.question,
        selectedOption,
        correctOption: currentQuestion?.answer,
        isCorrect,
        timeSpent,
      }

      // Update local state
      setAnswers((prev) => [...prev, answer])

      // Submit answer to Redux
      submitQuizAnswer({
        answer: selectedOption,
        userAnswer: selectedOption,
        isCorrect,
        timeSpent,
        questionId: currentQuestion?.id || currentQuestionIndex,
      })

      // Move to the next question or complete the quiz
      if (isLastQuestion) {
        handleQuizCompletion([...answers, answer])
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
  }

  const handleQuizCompletion = async (finalAnswers: any[]) => {
    setIsCompleting(true)

    try {
      // Calculate score using the utility function
      const correctAnswers = finalAnswers.filter((a) => a.isCorrect).length
      const totalQuestions = questions?.length || 0
      const score = quizUtils.calculateScore(
        finalAnswers.map((a) => ({
          answer: a.selectedOption,
          isCorrect: a.isCorrect,
          timeSpent: a.timeSpent,
        })),
        "mcq",
      )

      // Calculate total time spent
      const totalTimeSpent = finalAnswers.reduce((total, answer) => total + (answer.timeSpent || 0), 0)
      const formattedTimeSpent = formatQuizTime(totalTimeSpent)

      // Prepare result data
      const quizResult = {
        quizId,
        slug,
        answers: finalAnswers,
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

      // Complete the quiz in Redux
      completeQuiz({
        answers: finalAnswers,
        score,
        completedAt: new Date().toISOString(),
      })

      // If the quiz requires authentication but user is not authenticated,
      // the handleAuthenticationRequired will be called by the Redux action
      if (state.requiresAuth && !state.isAuthenticated) {
        handleAuthenticationRequired(`/dashboard/mcq/${slug}?fromAuth=true`)
      } else {
        // Show results if user is authenticated or auth not required
        setShowResults(true)
      }
    } catch (err) {
      console.error("Error completing quiz:", err)
      const error = createQuizError(QuizErrorType.UNKNOWN, "Failed to complete the quiz. Please try again.", err, true)
      setError(error)
    } finally {
      setIsCompleting(false)
    }
  }

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

  if (!currentQuestion && !showResults) {
    return (
      <Card className="p-6 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <p>Loading questions...</p>
      </Card>
    )
  }

  // If the quiz is completed and requires auth, show auth prompt
  if (state.isCompleted && state.requiresAuth && !state.isAuthenticated) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center gap-4">
          <h3 className="text-xl font-semibold">Sign In to Save Results</h3>
          <p className="text-muted-foreground">You need to sign in to save your quiz results.</p>
          <div className="flex gap-4">
            <Button
              onClick={() => handleAuthenticationRequired(`/dashboard/mcq/${slug}?fromAuth=true`)}
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
  }

  // Show results if quiz is completed
  if (showResults && quizResults) {
    return <McqQuizResult result={quizResults} />
  }

  return (
    <div className="space-y-6">
      {process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEBUG_MODE === "true" && (
        <Card className="bg-slate-50 border-slate-200">
          <div className="p-3">
            <h3 className="text-sm text-slate-700">Quiz State Debug</h3>
            <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-60 mt-2">
              {JSON.stringify(state, null, 2)}
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
