"use client"

import { useEffect, useCallback, useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store"
import { initializeQuiz, completeQuiz, setCurrentQuestion } from "@/app/store/slices/textQuizSlice"
import type { OpenEndedQuizData } from "@/types/quiz"
import OpenEndedQuizQuestion from "./OpenEndedQuizQuestion"

interface OpenEndedQuizWrapperProps {
  quizData: OpenEndedQuizData
  slug: string
}

export default function OpenEndedQuizWrapper({ quizData, slug }: OpenEndedQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const quizState = useAppSelector((state) => state.textQuiz)
  const [isInitializing, setIsInitializing] = useState(true)
  const navigatingRef = useRef(false)
  const quizCompletedRef = useRef(false)

  const isValidQuizData = useMemo(() => {
    return Boolean(
      quizData?.id &&
      Array.isArray(quizData.questions) &&
      quizData.questions.length > 0 &&
      quizData.questions.every((q) => q.question && q.answer)
    )
  }, [quizData])

  const quizInfo = useMemo(() => ({
    id: quizData?.id,
    questionCount: quizData?.questions?.length || 0,
    hasQuestions: Boolean(quizData?.questions?.length),
    isValid: isValidQuizData,
  }), [quizData?.id, quizData?.questions?.length, isValidQuizData])

  useEffect(() => {
    const initTimer = setTimeout(() => {
      if (quizInfo.id && quizInfo.hasQuestions && slug) {
        dispatch(
          initializeQuiz({
            ...quizData,
            type: "openended",
            slug,
          })
        )
      }
      setIsInitializing(false)
    }, 500)

    return () => clearTimeout(initTimer)
  }, [dispatch, quizInfo.id, quizInfo.hasQuestions, slug, quizData])

  const handleQuestionComplete = useCallback(() => {
    if (navigatingRef.current || quizCompletedRef.current) return

    const currentIndex = quizState?.currentQuestionIndex ?? 0

    if (currentIndex === quizInfo.questionCount - 1) {
      navigatingRef.current = true
      quizCompletedRef.current = true

      const completionTimestamp = new Date().toISOString()
      const currentAnswers = quizState?.answers ?? []

      dispatch(
        completeQuiz({
          answers: currentAnswers,
          completedAt: completionTimestamp,
          quizId: quizData?.id || quizState?.quizData?.id,
          title: quizData?.title || quizState?.quizData?.title || "Open Ended Quiz",
          score: 0, // Will be calculated on results page
          questions: quizData.questions, // Include questions for result page
          slug: slug // Include slug for validation
        })
      )

      // Small delay to ensure state is updated before navigation
      setTimeout(() => {
        router.replace(`/dashboard/openended/${slug}/results`)
      }, 200)
    } else {
      dispatch(setCurrentQuestion(currentIndex + 1))
    }
  }, [quizState, quizInfo.questionCount, router, slug, dispatch, quizData])

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-muted-foreground">Initializing your quiz...</p>
        </div>
      </div>
    )
  }

  if (!quizInfo.isValid) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="text-destructive">Invalid quiz data. Please try again later.</p>
          <button
            onClick={() => router.push("/dashboard/quizzes")}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Return to Quizzes
          </button>
        </div>
      </div>
    )
  }

  const currentQuestionIndex = quizState?.currentQuestionIndex ?? 0
  const currentQuestion = quizData.questions[currentQuestionIndex]

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="text-destructive">Failed to load quiz question.</p>
          <button
            onClick={() => router.push("/dashboard/quizzes")}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Return to Quizzes
          </button>
        </div>
      </div>
    )
  }

  return (
    <OpenEndedQuizQuestion
      question={currentQuestion}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={quizInfo.questionCount}
      isLastQuestion={currentQuestionIndex === quizInfo.questionCount - 1}
      onQuestionComplete={handleQuestionComplete}
    />
  )
}
