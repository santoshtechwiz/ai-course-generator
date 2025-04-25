"use client"

import { useRouter } from "next/navigation"
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { memo } from "react"

import CodingQuiz from "./CodingQuiz"
import CodeQuizResult from "./CodeQuizResult"
import { QuizProvider, useQuiz } from "@/app/context/QuizContext"
import { GuestPrompt } from "../../components/GuestSignInPrompt"

// Define proper types for the quiz data
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

// Memoize the content component to prevent unnecessary re-renders
const CodeQuizContent = memo(function CodeQuizContent({ quizData, slug }: CodeQuizContentProps) {
  const { state, submitAnswer, completeQuiz, restartQuiz } = useQuiz()
  const router = useRouter()
  const { currentQuestionIndex, questionCount, isLoading, error,
    isCompleted, showAuthPrompt, answers } = state
  
  // Ensure questions is always an array
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
        // Use type guard to ensure non-null answers
        completeQuiz(updatedAnswers.filter((a): a is QuizAnswer => a !== null))
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
            <Button onClick={() => router.push("/dashboard/code")}>Return to Quiz Creator</Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  } else if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    content = (
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
  } else if (showAuthPrompt) {
    content = <GuestPrompt />
  } else if (isCompleted) {
    content = <CodeQuizResult title={quizData?.title || "Code Quiz"} onRestart={restartQuiz} />
  } else {
    // Ensure currentQuestion has options before rendering CodingQuiz
    if (currentQuestion && Array.isArray(currentQuestion.options)) {
      content = (
        <CodingQuiz
          question={currentQuestion}
          onAnswer={handleAnswer}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questionCount}
        />
      )
    } else {
      // Handle case where options are missing
      content = (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Question Error</AlertTitle>
          <AlertDescription>
            This question appears to be missing options. Please try reloading or contact support.
            <div className="mt-4">
              <Button onClick={() => router.push("/dashboard/code")}>Return to Quiz Creator</Button>
            </div>
          </AlertDescription>
        </Alert>
      )
    }
  }

  return <div className="w-full max-w-3xl mx-auto p-4">{content}</div>
})

interface CodeQuizWrapperProps {
  quizData: QuizData
  slug: string
  userId: string
}

export default function CodeQuizWrapper({ quizData, slug, userId }: CodeQuizWrapperProps) {
  // Log the quiz data to debug options issue
  console.log("Quiz data:", quizData);
  
  // Ensure quizData has the expected structure
  const validatedQuizData: QuizData = {
    ...quizData,
    questions: Array.isArray(quizData?.questions) 
      ? quizData.questions.map((q: Question) => ({
          ...q,
          // Ensure options is always an array
          options: Array.isArray(q.options) ? q.options : []
        }))
      : []
  };
  
  return (
    <QuizProvider quizData={validatedQuizData} slug={slug}>
      <CodeQuizContent quizData={validatedQuizData} slug={slug} />
    </QuizProvider>
  )
}
