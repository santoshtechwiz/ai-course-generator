"use client"
import { useRouter } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { memo } from "react"

import McqQuiz from "./McqQuiz"
import McqQuizResult from "./McqQuizResult"
import { QuizProvider, useQuiz } from "@/app/context/QuizContext"
import { GuestPrompt } from "../../components/GuestSignInPrompt"

interface McqQuizContentProps {
  quizData: any
  slug: string
}

// Memoize the content component to prevent unnecessary re-renders
const McqQuizContent = memo(function McqQuizContent({ quizData, slug }: McqQuizContentProps) {
  const { state, submitAnswer, completeQuiz, restartQuiz } = useQuiz()
  const router = useRouter()

  const { currentQuestionIndex, questionCount, isLoading, error, isCompleted, showAuthPrompt, answers } = state

  const questions = quizData?.questions || []
  const currentQuestion = questions[currentQuestionIndex]

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

  // Render content based on state
  let content

  if (isLoading) {
    content = (
      <div className="flex flex-col items-center justify-center min-h-[200px] gap-3" aria-live="polite">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" aria-hidden="true"></div>
        <p className="text-sm text-muted-foreground">Loading quiz data...</p>
      </div>
    )
  } else if (error) {
    content = (
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
  } else if (!questions || questions.length === 0) {
    content = (
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
  } else if (showAuthPrompt) {
    content = <GuestPrompt />
  } else if (isCompleted) {
    content = <McqQuizResult title={quizData?.title || "Quiz"} onRestart={restartQuiz} />
  } else {
    content = (
      <McqQuiz
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={questionCount}
      />
    )
  }

  return <div className="w-full max-w-3xl mx-auto p-4">{content}</div>
})

interface McqQuizWrapperProps {
  quizData: any
  slug: string
}

export default function McqQuizWrapper({ quizData, slug }: McqQuizWrapperProps) {
  return (
    <QuizProvider quizData={quizData} slug={slug}>
      <McqQuizContent quizData={quizData} slug={slug} />
    </QuizProvider>
  )
}
