"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "@/store"
import {
  selectQuestions,
  selectAnswers,
  selectQuizStatus,
  selectQuizError,
  selectCurrentQuestionIndex,
  selectCurrentQuestion,
  selectQuizTitle,
  selectIsQuizComplete,
  setCurrentQuestionIndex,
  saveAnswer,
  fetchQuiz,
  setQuizCompleted,
} from "@/store/slices/quiz-slice"
import { QuizLoader } from "@/components/ui/quiz-loader"
import type { BlankQuestion } from "./types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw } from "lucide-react"
import BlanksQuiz from "./BlanksQuiz"
import type { QuizType } from "@/types/quiz"

interface BlanksQuizWrapperProps {
  slug: string
  quizData?: {
    title?: string
    questions?: BlankQuestion[]
  }
}

export default function BlanksQuizWrapper({ slug, quizData }: BlanksQuizWrapperProps) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()

  // Redux selectors
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const quizStatus = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const currentQuestionIndex = useSelector(selectCurrentQuestionIndex)
  const currentQuestion = useSelector(selectCurrentQuestion)
  const quizTitle = useSelector(selectQuizTitle)
  const isCompleted = useSelector(selectIsQuizComplete)

  // Load quiz data on mount
  useEffect(() => {
    if (quizStatus === "idle") {
      const quizPayload = quizData?.questions?.length
        ? {
            slug,
            data: {
              slug,
              title: quizData.title || "Blanks Quiz",
              questions: quizData.questions,
              type: "blanks" as QuizType,
            },
            type: "blanks" as QuizType,
          }
        : { slug, type: "blanks" as QuizType }

      dispatch(fetchQuiz(quizPayload))
    }
  }, [quizStatus, dispatch, slug, quizData])

  // Handle quiz completion - only when explicitly triggered
  useEffect(() => {
    if (!isCompleted) return
    
    // When complete, navigate to results
    const safeSlug = typeof slug === "string" ? slug : String(slug)
    router.push(`/dashboard/blanks/${safeSlug}/results`)
  }, [isCompleted, router, slug])

  // Answer handler
  const handleAnswer = (answer: string) => {
    if (!currentQuestion) return

    // Store the answer in Redux
    dispatch(
      saveAnswer({
        questionId: currentQuestion.id,
        answer: {
          questionId: currentQuestion.id,
          userAnswer: answer,
          type: "blanks",
          filledBlanks: {
            [currentQuestion.id]: answer,
          },
          timestamp: Date.now(),
        },
      })
    )
  }

  // Navigation handlers
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      dispatch(setCurrentQuestionIndex(currentQuestionIndex - 1))
    }
  }

  // Complete the quiz
  const handleFinish = () => {
    dispatch(setQuizCompleted())
  }

  // UI calculations
  const answeredQuestions = Object.keys(answers).length
  const progressPercentage = (answeredQuestions / questions.length) * 100

  // Loading state
  if (quizStatus === "loading") {
    return <QuizLoader message="Loading quiz data" subMessage="Preparing your blank questions" />
  }

  // Error state
  if (quizStatus === "failed") {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Quiz Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">{error || "Unable to load quiz data."}</p>
            <div className="space-x-4">
              <Button onClick={() => window.location.reload()}>Try Again</Button>
              <Button variant="outline" onClick={() => router.push("/dashboard/quizzes")}>
                Back to Quizzes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Empty questions state
  if (!Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">No Questions Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">This quiz has no questions.</p>
            <Button onClick={() => router.push("/dashboard/quizzes")}>Back to Quizzes</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // No current question state
  if (!currentQuestion) {
    return <QuizLoader steps={[{ label: "Initializing quiz", status: "loading" }]} />
  }

  // Current answer from Redux
  const currentAnswer = answers[currentQuestion.id]
  const existingAnswer = currentAnswer?.userAnswer || 
                         currentAnswer?.filledBlanks?.[currentQuestion.id] || 
                         ""

  // Navigation state
  const canGoNext = currentQuestionIndex < questions.length - 1
  const canGoPrevious = currentQuestionIndex > 0
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  // Submitting state
  if (quizStatus === "submitting") {
    return <QuizLoader full message="Quiz Completed! 🎉" subMessage="Calculating your results..." />
  }

  // Show current question
  return (
    <BlanksQuiz
      question={currentQuestion}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={questions.length}
      existingAnswer={existingAnswer}
      onAnswer={handleAnswer}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onSubmit={handleFinish}
      isSubmitting={quizStatus === "submitting"}
      canGoNext={canGoNext}
      canGoPrevious={canGoPrevious}
      isLastQuestion={isLastQuestion}
    />
  )
}
