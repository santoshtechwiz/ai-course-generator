"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { SignInPrompt } from "@/app/auth/signin/components/SignInPrompt"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

import { FillInTheBlanksQuiz } from "./FillInTheBlanksQuiz"
import BlankQuizResults from "./BlankQuizResults"
import { useQuizResult } from "@/hooks/use-quiz-result"
import { QuizSubmissionFeedback } from "../../components/QuizSubmissionFeedback"

interface Question {
  id: number
  question: string
  answer: string
  openEndedQuestion: {
    hints: string[]
    difficulty: string
    tags: string[]
    inputType: string
  }
}

interface BlankQuizWrapperProps {
  questions: Question[]
  quizId: string
  title: string
  slug: string
}

export default function BlankQuizWrapper({ questions, quizId, title, slug }: BlankQuizWrapperProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{ answer: string; timeSpent: number; hintsUsed: boolean }[]>([])
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const { data: session } = useSession()
  const isAuthenticated = !!session

  const { submitQuizResult, isSubmitting, isSuccess, isError, errorMessage, resetSubmissionState } = useQuizResult({})

  // Initialize with loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  // Initialize answers array when questions are available
  useEffect(() => {
    if (questions && questions.length > 0) {
      setAnswers(
        Array(questions.length)
          .fill(null)
          .map(() => ({
            answer: "",
            timeSpent: 0,
            hintsUsed: false,
          })),
      )
    }
  }, [questions])

  const handleAnswer = useCallback(
    (answer: string) => {
      if (!questions || currentQuestionIndex >= questions.length) return

      const now = Date.now()
      const newAnswers = [...answers]
      newAnswers[currentQuestionIndex] = {
        answer,
        timeSpent: Math.floor(now / 1000) - (answers[currentQuestionIndex]?.timeSpent || Math.floor(now / 1000)),
        hintsUsed: false, // This would need to be passed from the quiz component
      }
      setAnswers(newAnswers)

      // Move to next question or complete quiz
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex((prev) => prev + 1)
        } else {
          setQuizCompleted(true)
        }
      }, 1000)
    },
    [currentQuestionIndex, questions, answers],
  )

  const handleRestart = useCallback(() => {
    if (!window.confirm("Are you sure you want to restart the quiz?")) return

    setCurrentQuestionIndex(0)
    setAnswers(
      Array(questions?.length || 0)
        .fill(null)
        .map(() => ({
          answer: "",
          timeSpent: 0,
          hintsUsed: false,
        })),
    )
    setQuizCompleted(false)
    setScore(0)
  }, [questions?.length])

  const handleComplete = useCallback(
    (finalScore: number) => {
      setScore(finalScore)

      // Save to database if authenticated
      if (isAuthenticated && quizId) {
        submitQuizResult(
          quizId,
          answers.map((a) => a.answer),
          answers.reduce((total, a) => total + a.timeSpent, 0),
          finalScore,
          "fill-blanks",
        )
      }
    },
    [answers, quizId, isAuthenticated, submitQuizResult],
  )

  const handleFeedbackContinue = useCallback(() => {
    resetSubmissionState?.()
  }, [resetSubmissionState])

  if (isLoading) {
    return <QuizLoader message="Loading quiz..." subMessage="Please wait while we prepare your questions" />
  }

  if (!questions || questions.length === 0) {
    return (
      <Card className="w-full max-w-3xl mx-auto my-8">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No questions available</h3>
          <p className="text-muted-foreground text-center mb-4">
            This quiz doesn't have any questions yet or there was an error loading them.
          </p>
          <Button onClick={() => router.push("/dashboard/blanks")}>Return to Fill-in-the-Blanks Quizzes</Button>
        </CardContent>
      </Card>
    )
  }

  if (quizCompleted) {
    return (
      <div className="space-y-6">
        {isAuthenticated ? (
          <>
            <BlankQuizResults
              answers={answers}
              questions={questions}
              onRestart={handleRestart}
              onComplete={handleComplete}
              quizId={quizId}
              title={title}
              slug={slug}
            />
            {(isSubmitting || isSuccess || isError) && (
              <QuizSubmissionFeedback
                score={score || 0}
                totalQuestions={questions.length}
                isSubmitting={isSubmitting}
                isSuccess={isSuccess}
                isError={isError}
                errorMessage={errorMessage}
                onContinue={handleFeedbackContinue}
                quizType="blanks"
              />
            )}
          </>
        ) : (
          <Card className="w-full max-w-3xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <h2 className="text-2xl font-bold mb-4">Quiz Completed</h2>
              <p className="text-muted-foreground mb-6">Sign in to view your results and save your progress.</p>
              <SignInPrompt callbackUrl={`/dashboard/blanks/${slug}`} />
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <FillInTheBlanksQuiz
      question={questions[currentQuestionIndex]}
      onAnswer={handleAnswer}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={questions.length}
    />
  )
}
