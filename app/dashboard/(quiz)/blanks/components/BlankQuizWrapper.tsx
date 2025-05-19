"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store"
import BlanksQuiz from "./BlanksQuiz"
import type { BlanksQuizWrapperProps } from "../blanks-quiz-types"
import { initializeQuiz, completeQuiz, setCurrentQuestion } from "@/app/store/slices/textQuizSlice"

export default function BlankQuizWrapper({ quizData, slug }: BlanksQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const quizState = useAppSelector((state) => state.textQuiz)
  const [isInitializing, setIsInitializing] = useState(true)
  const navigatingRef = useRef(false)
  const quizCompletedRef = useRef(false)

  // Validate quiz data
  const isValidQuizData = Boolean(
    quizData?.id &&
    Array.isArray(quizData.questions) &&
    quizData.questions.length > 0
  );

  // Initialize quiz with safety check
  useEffect(() => {
    const initTimer = setTimeout(() => {
      if (quizData?.id && quizData?.questions?.length > 0 && slug) {
        dispatch(
          initializeQuiz({
            ...quizData,
            type: "blanks",
            slug,
          }),
        )
      }
      setIsInitializing(false)
    }, 500);

    return () => clearTimeout(initTimer);
  }, [dispatch, quizData, slug])

  const handleQuestionComplete = useCallback(() => {
    if (navigatingRef.current || quizCompletedRef.current) return;

    const currentIndex = quizState?.currentQuestionIndex ?? 0

    if ((currentIndex === quizData.questions.length - 1) || !quizData.questions[currentIndex + 1]) {
      navigatingRef.current = true
      quizCompletedRef.current = true

      const completionTimestamp = new Date().toISOString()
      const currentAnswers = quizState?.answers ?? []

      dispatch(
        completeQuiz({
          answers: currentAnswers,
          completedAt: completionTimestamp,
          quizId: quizData?.id || quizState?.quizData?.id,
          title: quizData?.title || quizState?.quizData?.title || "Fill in the Blanks Quiz",
          score: 0, // Will be calculated on results page
          questions: quizData.questions, // Include questions for result page
          slug: slug // Include slug for validation
        })
      )

      // Small delay to ensure state is updated before navigation
      setTimeout(() => {
        router.replace(`/dashboard/blanks/${slug}/results`)
      }, 200)
    } else {
      dispatch(setCurrentQuestion(currentIndex + 1))
    }
  }, [quizState, quizData, router, slug, dispatch])

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

  if (!isValidQuizData) {
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
    <BlanksQuiz
      question={currentQuestion}
      questionNumber={currentQuestionIndex + 1}
      totalQuestions={quizData.questions.length}
      isLastQuestion={currentQuestionIndex === quizData.questions.length - 1}
      onQuestionComplete={handleQuestionComplete}
    />
  )
}
