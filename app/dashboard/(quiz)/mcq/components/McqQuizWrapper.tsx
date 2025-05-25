"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store"
import {
  saveAnswer,
  submitQuiz,
  setCurrentQuestionIndex,
  saveAuthRedirectState,
  selectQuestions,
  selectAnswers,
  selectCurrentQuestionIndex,
  selectQuizStatus,
  selectQuizError,
  selectCurrentQuestion,
  selectQuizId,
} from "@/store/slices/quizSlice"
import { toast } from "sonner"
import { signIn } from "next-auth/react"

import { UserAnswer } from "./types"
import McqQuiz from "./McqQuiz"
import McqResultPreview from "./MCQResultPreview"
import { createMcqResultsPreview } from "./MCQQuizHelpers"
import {
  ErrorDisplay,
  EmptyQuestionsDisplay,
  InitializingDisplay,
} from "../../components/QuizStateDisplay"
import { QuizSubmissionLoading } from "../../components/QuizSubmissionLoading"
import NonAuthenticatedUserSignInPrompt from "../../components/NonAuthenticatedUserSignInPrompt"

interface McqQuizWrapperProps {
  slug: string
  userId?: string | null
}

export default function McqQuizWrapper({
  slug,
  userId,
}: McqQuizWrapperProps) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tempResults, setTempResults] = useState<any>(null)

  // Get quiz data from Redux store
  const quizId = useAppSelector(selectQuizId)
  const questions = useAppSelector(selectQuestions)
  const answers = useAppSelector(selectAnswers)
  const currentQuestion = useAppSelector(selectCurrentQuestion)
  const currentIndex = useAppSelector(selectCurrentQuestionIndex)
  const status = useAppSelector(selectQuizStatus)
  const error = useAppSelector(selectQuizError)

  const isLoading = status === "loading"
  const hasError = status === "error"

  // Reset quiz if requested via URL param
  useEffect(() => {
    if (searchParams?.get("reset") === "true") {
      dispatch(setCurrentQuestionIndex(0))
      setIsSubmitting(false)
      setTempResults(null)
    }
  }, [searchParams, dispatch])

  const handleAnswer = useCallback(
    (answerId: string, elapsedTime: number, isCorrect: boolean) => {
      if (!currentQuestion) return

      dispatch(
        saveAnswer({
          questionId: currentQuestion.id,
          answer: {
            questionId: currentQuestion.id,
            selectedOptionId: answerId,
            isCorrect,
            timeSpent: elapsedTime,
            timestamp: Date.now(),
          },
        }),
      )

      const isLast = currentIndex === questions.length - 1

      if (isLast) {
        const allAnswers = [
          ...Object.values(answers),
          {
            questionId: currentQuestion.id,
            selectedOption: answerId,
            isCorrect,
          },
        ] as UserAnswer[]

        const preview = createMcqResultsPreview({
          questions,
          answers: allAnswers,
          quizTitle: questions.length > 0 ? questions[0].text || "MCQ Quiz" : "MCQ Quiz",
          slug,
        })

        setTempResults(preview)

        if (userId) handleSubmitQuiz()
      } else {
        dispatch(setCurrentQuestionIndex(currentIndex + 1))
      }
    },
    [dispatch, currentQuestion, answers, questions, currentIndex, slug, userId],
  )

  const handleSubmitQuiz = useCallback(async () => {
    try {
      setIsSubmitting(true)
      const totalTime = Object.values(answers).reduce((acc: number, a: any) => acc + (a.timeSpent || 0), 0)

      await dispatch(
        submitQuiz({
          slug,
          quizId,
          type: "mcq",
          timeTaken: totalTime,
        }),
      ).unwrap()

      router.replace(`/dashboard/mcq/${slug}/results`)
    } catch (e) {
      toast.error("Failed to submit quiz.")
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }, [dispatch, answers, quizId, slug, router])

  const handleShowSignIn = useCallback(() => {
    dispatch(
      saveAuthRedirectState({
        slug,
        quizId: quizId || "",
        type: "mcq",
        answers,
        currentQuestionIndex: currentIndex,
        tempResults,
      }),
    )

    signIn(undefined, {
      callbackUrl: `/dashboard/mcq/${slug}?fromAuth=true`,
    })
  }, [dispatch, slug, quizId, answers, currentIndex, tempResults])

  const handleRetry = useCallback(() => {
    if (!userId) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/mcq/${slug}`)}`)
    } else {
      window.location.reload()
    }
  }, [userId, slug, router])

  if (isLoading || isSubmitting) {
    return isSubmitting ? <QuizSubmissionLoading quizType="mcq" /> : <InitializingDisplay />
  }

  if (hasError) {
    return (
      <ErrorDisplay
        error={error || "Failed to load quiz"}
        onRetry={handleRetry}
        onReturn={() => router.push("/dashboard")}
      />
    )
  }

  if (!questions.length) {
    return <EmptyQuestionsDisplay message="This quiz has no questions." onReturn={() => router.push("/dashboard")} />
  }

  if (!userId && tempResults) {
    return (
      <NonAuthenticatedUserSignInPrompt
        quizType="mcq"
        onSignIn={handleShowSignIn}
        showSaveMessage
        message="Please sign in to submit your quiz and save your results"
        previewData={tempResults}
      />
    )
  }

  if (userId && tempResults) {
    return (
      <McqResultPreview
        result={tempResults}
        onSubmit={handleSubmitQuiz}
        onCancel={() => setTempResults(null)}
        userAnswers={Object.values(answers) as UserAnswer[]}
        isSubmitting={isSubmitting}
      />
    )
  }

  if (currentQuestion) {
    const userAnswer = answers[currentQuestion.id]?.selectedOptionId

    return (
      <McqQuiz
        question={currentQuestion}
        onAnswer={handleAnswer}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        isLastQuestion={currentIndex === questions.length - 1}
        isSubmitting={isSubmitting}
        existingAnswer={typeof userAnswer === "string" ? userAnswer : undefined}
      />
    )
  }

  return <InitializingDisplay />
}
