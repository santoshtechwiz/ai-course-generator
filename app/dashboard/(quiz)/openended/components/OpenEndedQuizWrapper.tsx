"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { SignInPrompt } from "@/app/auth/signin/components/SignInPrompt"

import OpenEndedQuizQuestion from "./OpenEndedQuizQuestion"
import QuizResultsOpenEnded from "./QuizResultsOpenEnded"
import type { QuestionOpenEnded } from "@/app/types/types"
import { useQuizResult } from "@/hooks/use-quiz-result"
import { useRouter } from "next/navigation"
import QuizActions from "../../components/QuizActions"
import { QuizSubmissionFeedback } from "../../components/QuizSubmissionFeedback"
import { QuizLoader } from "@/components/ui/quiz-loader"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface QuizData {
  id: number
  questions: QuestionOpenEnded[]
  title: string
  userId: string
}

interface OpenEndedQuizWrapperProps {
  slug: string
  quizData: QuizData
}

interface Answer {
  answer: string
  timeSpent: number
  hintsUsed: boolean
}

const OpenEndedQuizWrapper: React.FC<OpenEndedQuizWrapperProps> = ({ slug, quizData }) => {
  const [activeQuestion, setActiveQuestion] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [quizStartTime, setQuizStartTime] = useState<number>(Date.now())
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Use refs to prevent multiple submissions and track callback state
  const isSubmittingRef = useRef(false)
  const hasCalledSuccessCallback = useRef(false)

  const { data: session, status } = useSession()
  const isAuthenticated = status === "authenticated"

  const { submitQuizResult, isSuccess, isError, errorMessage, resetSubmissionState, result } = useQuizResult({})

  // Handle success with useEffect
  useEffect(() => {
    if (isSuccess && result && !hasCalledSuccessCallback.current) {
      hasCalledSuccessCallback.current = true
      console.log("Quiz submission successful:", result)
    }
  }, [isSuccess, result])

  // Handle navigation after submission
  const handleFeedbackContinue = useCallback(() => {
    setQuizCompleted(true)
    resetSubmissionState?.()
  }, [resetSubmissionState])

  // Reset submission state when success or error changes
  useEffect(() => {
    if (isSuccess || isError) {
      setIsSubmitting(false)
      isSubmittingRef.current = false
    }
  }, [isSuccess, isError])

  // Initialize answers when quiz data is available
  useEffect(() => {
    // Add a small delay to simulate loading and prevent immediate flashing
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 500)

    if (quizData?.questions && quizData.questions.length > 0) {
      const initialAnswers = Array(quizData.questions.length)
        .fill(null)
        .map(() => ({
          answer: "",
          timeSpent: 0,
          hintsUsed: false,
        }))
      setAnswers(initialAnswers)
      setQuizStartTime(Date.now())
      setQuestionStartTime(Date.now())
    }

    return () => clearTimeout(timer)
  }, [quizData?.questions])

  const handleAnswerSubmit = useCallback(
    (answer: string) => {
      if (!quizData || !quizData.questions || activeQuestion >= quizData.questions.length) return

      const currentIndex = activeQuestion
      const timeSpent = (Date.now() - questionStartTime) / 1000

      const newAnswer: Answer = {
        answer,
        timeSpent,
        hintsUsed: false,
      }

      setAnswers((prevAnswers) => {
        const updatedAnswers = [...prevAnswers]
        updatedAnswers[currentIndex] = newAnswer
        return updatedAnswers
      })

      const isLast = currentIndex === quizData.questions.length - 1

      if (isLast) {
        setQuizCompleted(true)
      } else {
        setActiveQuestion((prev) => prev + 1)
        setQuestionStartTime(Date.now())
      }
    },
    [activeQuestion, quizData, questionStartTime],
  )

  const handleRestart = useCallback(() => {
    if (!window.confirm("Are you sure you want to restart the quiz?")) return

    setActiveQuestion(0)
    setAnswers(
      Array(quizData?.questions?.length || 0)
        .fill(null)
        .map(() => ({
          answer: "",
          timeSpent: 0,
          hintsUsed: false,
        })),
    )
    setQuizCompleted(false)
    setScore(null)
    setQuizStartTime(Date.now())
    setQuestionStartTime(Date.now())
    setHasSubmitted(false)
    isSubmittingRef.current = false
    hasCalledSuccessCallback.current = false
  }, [quizData?.questions?.length])

  const handleComplete = useCallback(
    (calculatedScore: number) => {
      setScore(calculatedScore)

      if (isSubmittingRef.current || hasSubmitted) {
        console.log("Submission already in progress or completed, ignoring")
        return
      }

      isSubmittingRef.current = true
      setScore(calculatedScore)

      if (isAuthenticated) {
        setIsSubmitting(true)
        setHasSubmitted(true)

        submitQuizResult(
          quizData.id.toString(),
          answers,
          (Date.now() - quizStartTime) / 1000,
          calculatedScore,
          "openended",
        )
      }
    },
    [isAuthenticated, answers, quizData?.id, quizStartTime, submitQuizResult, hasSubmitted],
  )

  if (isLoading) {
    return <QuizLoader message="Loading quiz..." subMessage="Please wait while we prepare your questions" />
  }

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <Card className="w-full max-w-3xl mx-auto my-8">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No questions available</h3>
          <p className="text-muted-foreground text-center mb-4">
            This quiz doesn't have any questions yet or there was an error loading them.
          </p>
          <Button onClick={() => router.push("/dashboard/openended")}>Return to Open-Ended Quizzes</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <QuizActions
        quizId={quizData.id.toString()}
        quizSlug={slug}
        userId={quizData.userId}
        ownerId={quizData.userId}
        initialIsPublic={false}
        initialIsFavorite={false}
        quizType="openended"
        position="left-center"
      />

      {isSubmitting && (
        <Card className="w-full max-w-3xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-6">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent text-primary rounded-full mb-2"></div>
            <p className="text-muted-foreground">Saving your quiz results...</p>
          </CardContent>
        </Card>
      )}

      {quizCompleted ? (
        isAuthenticated ? (
          <>
            <QuizResultsOpenEnded
              answers={answers}
              questions={quizData.questions}
              onRestart={handleRestart}
              onComplete={handleComplete}
              quizId={quizData.id.toString()}
              title={quizData.title}
              slug={slug}
            />
            {isSuccess && result && !isSubmitting && (
              <QuizSubmissionFeedback
                score={score || 0}
                totalQuestions={quizData.questions.length}
                isSubmitting={false}
                isSuccess={isSuccess}
                isError={isError}
                errorMessage={errorMessage}
                onContinue={handleFeedbackContinue}
                quizType="openended"
              />
            )}
          </>
        ) : (
          <Card className="w-full max-w-3xl mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <h2 className="text-2xl font-bold mb-4">Quiz Completed</h2>
              <p className="text-muted-foreground mb-6">Sign in to view your results and save your progress.</p>
              <SignInPrompt callbackUrl={`/dashboard/openended/${slug}`} />
            </CardContent>
          </Card>
        )
      ) : (
        <OpenEndedQuizQuestion
          question={quizData.questions[activeQuestion]}
          onAnswer={handleAnswerSubmit}
          questionNumber={activeQuestion + 1}
          totalQuestions={quizData.questions.length}
        />
      )}
    </div>
  )
}

export default OpenEndedQuizWrapper
