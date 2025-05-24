"use client"

import React, { useState, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store"
import {
  fetchQuiz,
  setQuizId,
  setQuizType,
  submitQuiz,
  setCurrentQuestionIndex,
  saveAnswer,
  selectQuestions,
  selectCurrentQuestion,
  selectCurrentQuestionIndex,
  selectQuizStatus,
  selectQuizError,
} from "@/store/slices/quizSlice"
import type { OpenEndedQuizData } from "@/types/quiz"
import OpenEndedQuizQuestion from "./OpenEndedQuizQuestion"
import { toast } from "react-hot-toast"

interface OpenEndedQuizWrapperProps {
  quizData: OpenEndedQuizData
  slug: string
  currentUserId?: string | null
  breadcrumbItems?: Array<{ name: string; href: string }>
}

export default function OpenEndedQuizWrapper({
  quizData,
  slug,
  currentUserId,
  breadcrumbItems,
}: OpenEndedQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()

  // Redux selectors
  const questions = useAppSelector(selectQuestions)
  const currentQuestion = useAppSelector(selectCurrentQuestion)
  const currentQuestionIndex = useAppSelector(selectCurrentQuestionIndex)
  const quizStatus = useAppSelector(selectQuizStatus)
  const error = useAppSelector(selectQuizError)

  const [isInitializing, setIsInitializing] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const isValidQuizData = useMemo(() => {
    return Boolean(
      quizData?.id &&
        Array.isArray(quizData.questions) &&
        quizData.questions.length > 0 &&
        quizData.questions.every((q) => q.question && q.answer),
    )
  }, [quizData])

  const quizInfo = useMemo(
    () => ({
      id: quizData?.id,
      questionCount: quizData?.questions?.length || 0,
      hasQuestions: Boolean(quizData?.questions?.length),
      isValid: isValidQuizData,
    }),
    [quizData?.id, quizData?.questions?.length, isValidQuizData],
  )

  useEffect(() => {
    const initTimer = setTimeout(() => {
      if (quizInfo.id && quizInfo.hasQuestions && slug) {
        dispatch(setQuizId(quizInfo.id.toString()))
        dispatch(setQuizType("openended"))
        dispatch(fetchQuiz({ id: quizInfo.id.toString(), data: quizData }))
      }
      setIsInitializing(false)
    }, 500)

    return () => clearTimeout(initTimer)
  }, [dispatch, quizInfo.id, quizInfo.hasQuestions, slug, quizData])

  const handleAnswerSubmit = useCallback(
    async (answer: string, elapsedTime: number, hintsUsed: boolean) => {
      if (isSubmitting || !currentQuestion) return

      setIsSubmitting(true)

      try {
        // Save answer to Redux
        await dispatch(
          saveAnswer({
            questionId: currentQuestion.id,
            answer: {
              questionId: currentQuestion.id,
              text: answer,
              timestamp: Date.now(),
            },
          }),
        ).unwrap()

        // Check if we're on the last question
        const isLastQuestion = currentQuestionIndex >= questions.length - 1

        if (!isLastQuestion) {
          // Move to the next question
          setTimeout(() => {
            setIsSubmitting(false)
            dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
          }, 50)
        } else {
          // This is the last question - handle quiz completion
          try {
            await dispatch(submitQuiz()).unwrap()

            toast.success("Quiz completed! Viewing your results...")
            router.push(`/dashboard/openended/${slug}/results`)
          } catch (error) {
            console.error("Failed to handle quiz completion:", error)
            setIsSubmitting(false)
            setSubmitError("Failed to process quiz results")

            // Continue to results page anyway since we have local data
            setTimeout(() => {
              router.push(`/dashboard/openended/${slug}/results`)
            }, 1500)
          }
        }
      } catch (error) {
        console.error("Error in answer handling:", error)
        setIsSubmitting(false)
        toast.error("Failed to process your answer. Please try again.")
      }
    },
    [currentQuestion, isSubmitting, questions.length, currentQuestionIndex, dispatch, slug, router],
  )

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
      onAnswer={handleAnswerSubmit}
    />
  )
}
