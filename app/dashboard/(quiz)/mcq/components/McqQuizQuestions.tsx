"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import McqQuiz from "./McqQuiz"
import { Card } from "@/components/ui/card"
import { Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useQuiz } from "@/app/context/QuizContext"

export default function McqQuizQuestions({ questions, quizId, slug }: any) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<any[]>([])
  const [isCompleting, setIsCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Use the quiz context for state management
  const { state, submitAnswer: submitQuizAnswer, completeQuiz, handleAuthenticationRequired } = useQuiz()

  // Validate questions on component mount
  useEffect(() => {
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      setError("No questions available for this quiz.")
      return
    }

    // Check if questions have the required fields
    const invalidQuestions = questions.filter((q) => !q || !q.question || !q.answer)

    if (invalidQuestions.length > 0) {
      console.error("Invalid questions found:", invalidQuestions)
      setError("Some questions in this quiz are invalid. Please try another quiz.")
    }
  }, [questions])

  const currentQuestion = questions?.[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === (questions?.length ?? 0) - 1

  const handleAnswer = (selectedOption: string, timeSpent: number, isCorrect: boolean) => {
    // Create answer object
    const answer = {
      answer: selectedOption,
      userAnswer: selectedOption,
      isCorrect,
      timeSpent,
    }

    // Update local state
    setAnswers((prev) => [...prev, answer])

    // Submit answer to Redux
    submitQuizAnswer(answer)

    // Move to the next question or complete the quiz
    if (isLastQuestion) {
      handleQuizCompletion([...answers, answer])
    } else {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handleQuizCompletion = async (finalAnswers: any[]) => {
    setIsCompleting(true)

    try {
      // Calculate score
      const correctAnswers = finalAnswers.filter((a) => a.isCorrect).length
      const totalQuestions = questions?.length || 0
      const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

      // Complete the quiz in Redux
      completeQuiz(finalAnswers)

      // If the quiz requires authentication but user is not authenticated,
      // the handleAuthenticationRequired will be called by the Redux action
      if (state.requiresAuth && !state.isAuthenticated) {
        if (typeof handleAuthenticationRequired === "function") {
          handleAuthenticationRequired(`/dashboard/mcq/${slug}?fromAuth=true`)
        } else {
          console.error("Authentication handler is not available")
          setError("Unable to process authentication. Please try again later.")
        }
      }
    } catch (error) {
      console.error("Error completing quiz:", error)
      setError("Failed to complete the quiz. Please try again.")
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
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => router.push("/dashboard/mcq")}>Return to Quiz List</Button>
        </div>
      </Card>
    )
  }

  if (!currentQuestion) {
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

  return (
    <div className="space-y-6">
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
