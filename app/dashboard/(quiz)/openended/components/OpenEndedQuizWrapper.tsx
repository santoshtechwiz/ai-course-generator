"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
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
}

export default function OpenEndedQuizWrapper({ quizData, slug }: OpenEndedQuizWrapperProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()

  // Redux selectors
  const questions = useAppSelector(selectQuestions)
  const currentQuestion = useAppSelector(selectCurrentQuestion)
  const currentQuestionIndex = useAppSelector(selectCurrentQuestionIndex)
  const quizStatus = useAppSelector(selectQuizStatus)
  const error = useAppSelector(selectQuizError)

  const [isInitializing, setIsInitializing] = useState(true)

  const isValidQuizData = useMemo(() => {
    return Boolean(
      quizData?.id &&
        Array.isArray(quizData.questions) &&
        quizData.questions.length > 0 &&
        quizData.questions.every((q) => q.question),
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
        // Pass the quiz data directly to avoid API call
        dispatch(
          fetchQuiz({
            id: quizInfo.id.toString(),
            data: {
              id: quizData.id,
              type: "openended",
              title: quizData.title,
              questions: quizData.questions.map((q) => ({
                id: q.id,
                text: q.question,
                type: "openended" as const,
                modelAnswer: q.answer,
                keywords: q.hints || [],
              })),
            },
          }),
        )
      }
      setIsInitializing(false)
    }, 500)

    return () => clearTimeout(initTimer)
  }, [dispatch, quizInfo.id, quizInfo.hasQuestions, slug, quizData])

  const handleAnswerSubmit = useCallback(
    async (answer: string, elapsedTime: number, hintsUsed: boolean) => {
      console.log("handleAnswerSubmit called with:", {
        answer,
        currentQuestionIndex,
        questionsLength: questions.length,
      })

      if (quizStatus === "submitting" || !currentQuestion) {
        console.log("Blocked submission:", { quizStatus, hasCurrentQuestion: !!currentQuestion })
        return
      }

      try {
        console.log("Saving answer to Redux...")

        // Save answer to Redux
        await dispatch(
          saveAnswer({
            questionId: currentQuestion.id,
            answer: {
              questionId: currentQuestion.id,
              text: answer,
              timestamp: Date.now(),
            } as any,
          }),
        ).unwrap()

        console.log("Answer saved successfully")

        // Check if we're on the last question
        const isLastQuestion = currentQuestionIndex >= questions.length - 1
        console.log(
          "Is last question:",
          isLastQuestion,
          "Current index:",
          currentQuestionIndex,
          "Total questions:",
          questions.length,
        )

        if (!isLastQuestion) {
          console.log("Moving to next question...")
          // Move to the next question
          dispatch(setCurrentQuestionIndex(currentQuestionIndex + 1))
          toast.success("Answer saved! Moving to next question...")
        } else {
          console.log("Submitting quiz...")
          // This is the last question - handle quiz completion
          try {
            await dispatch(submitQuiz()).unwrap()
            toast.success("Quiz completed! Viewing your results...")
            router.push(`/dashboard/openended/${slug}/results`)
          } catch (error) {
            console.error("Failed to handle quiz completion:", error)
            toast.error("Failed to submit quiz, but your answers are saved")
            // Continue to results page anyway since we have local data
            router.push(`/dashboard/openended/${slug}/results`)
          }
        }
      } catch (error) {
        console.error("Error in answer handling:", error)
        toast.error("Failed to process your answer. Please try again.")
      }
    },
    [currentQuestion, questions.length, currentQuestionIndex, dispatch, slug, router, quizStatus],
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

  if (quizStatus === "error") {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <p className="text-destructive">Error: {error}</p>
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

  console.log("Rendering question:", {
    questionId: currentQuestion.id,
    questionNumber: currentQuestionIndex + 1,
    totalQuestions: quizInfo.questionCount,
    isLastQuestion: currentQuestionIndex === quizInfo.questionCount - 1,
  })

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
