"use client"

import { useEffect, useState } from "react"
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
  setQuizResults,
} from "@/store/slices/quiz-slice"
import { QuizLoader } from "@/components/ui/quiz-loader"
import type { BlankQuestion } from "./types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

  // Track if we've already submitted to prevent double submissions
  const [hasSubmitted, setHasSubmitted] = useState(false)

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
    if (!isCompleted || hasSubmitted) return

    // When complete, navigate to results page
    const safeSlug = typeof slug === "string" ? slug : String(slug)

    // Add a small delay for better UX
    const timer = setTimeout(() => {
      router.push(`/dashboard/blanks/${safeSlug}/results`)
    }, 1000)

    return () => clearTimeout(timer)
  }, [isCompleted, router, slug, hasSubmitted])

  // Answer handler - fixed to properly store answers
  const handleAnswer = (answer: string) => {
    if (!currentQuestion) return

    // Store the answer in Redux with proper structure
    dispatch(
      saveAnswer({
        questionId: currentQuestion.id,
        answer: {
          questionId: currentQuestion.id,
          userAnswer: answer,
          text: answer, // Add text field for consistency
          type: "blanks",
          isCorrect: answer.trim().toLowerCase() === (currentQuestion.answer || "").trim().toLowerCase(),
          timestamp: Date.now(),
        },
      }),
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

  // Complete the quiz - fixed logic
  const handleFinish = () => {
    if (hasSubmitted) return

    const answeredCount = Object.keys(answers).length
    const totalQuestions = questions.length

    // Allow submission regardless of how many questions are answered
    console.log(`Submitting quiz with ${answeredCount} out of ${totalQuestions} questions answered`)

    setHasSubmitted(true)

    // Generate results for all questions (including unanswered ones)
    const questionResults = questions.map((question) => {
      const qid = String(question.id)
      const answer = answers[qid]
      const userAnswer = answer?.userAnswer || answer?.text || ""
      const correctAnswer = question.answer || ""
      const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()

      return {
        questionId: qid,
        question: question.question || question.text,
        correctAnswer,
        userAnswer,
        isCorrect,
        type: "blanks",
      }
    })

    const correctCount = questionResults.filter((q) => q.isCorrect).length
    const percentage = Math.round((correctCount / questions.length) * 100)

    const results = {
      quizId: slug,
      slug: slug,
      title: quizTitle || "Blanks Quiz",
      quizType: "blanks",
      score: correctCount,
      maxScore: questions.length,
      percentage,
      completedAt: new Date().toISOString(),
      questionResults,
      questions: questionResults,
    }

    // Set results first, then mark as completed
    dispatch(setQuizResults(results))
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
  const existingAnswer = currentAnswer?.userAnswer || currentAnswer?.text || ""

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
      isSubmitting={quizStatus === "submitting" || hasSubmitted}
      canGoNext={canGoNext}
      canGoPrevious={canGoPrevious}
      isLastQuestion={isLastQuestion}
    />
  )
}
