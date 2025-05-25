"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppDispatch, useAppSelector } from "@/store"
import {
  fetchQuiz,
  setQuizId,
  setQuizType,
  submitQuiz,
  selectQuestions,
  selectAnswers,
  selectQuizStatus,
  selectQuizError,
  selectIsQuizComplete,
  selectQuizResults,
  selectCurrentQuestionIndex
} from "@/store/slices/quizSlice"
import { ErrorDisplay } from "../../components/QuizStateDisplay"
import { BlanksQuiz } from "./BlanksQuiz"
import { Button } from "@/components/ui/button"

interface BlankQuizWrapperProps {
  quizData: {
    id: string
    slug: string
    title: string
    description?: string
    questions: any[]
  }
  slug: string
}

export const BlankQuizWrapper: React.FC<BlankQuizWrapperProps> = ({ quizData, slug }) => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const questions = useAppSelector(selectQuestions)
  const answers = useAppSelector(selectAnswers)
  const status = useAppSelector(selectQuizStatus)
  const error = useAppSelector(selectQuizError)
  const isQuizComplete = useAppSelector(selectIsQuizComplete)
  const results = useAppSelector(selectQuizResults)
  const currentQuestionIndex = useAppSelector(selectCurrentQuestionIndex)

  // Initialize quiz data
  useEffect(() => {
    if (quizData) {
      dispatch(setQuizId(quizData.id))
      dispatch(setQuizType("blanks"))
      dispatch(fetchQuiz({
        id: quizData.id,
        data: quizData,
        type: "blanks"
      }))
    }
  }, [dispatch, quizData])

  // Handle quiz submission
  const handleSubmitQuiz = async () => {
    if (isQuizComplete) {
      setIsSubmitting(true)
      try {
        await dispatch(submitQuiz()).unwrap()
        router.push(`/dashboard/blanks/${slug}/results`)
      } catch (error) {
        console.error("Error submitting quiz:", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  // Show loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (status === "error" || !quizData) {
    return (
      <ErrorDisplay
        error={error || "Failed to load quiz"}
        onRetry={() => dispatch(fetchQuiz({
          id: quizData?.id, data: quizData,
          type: "mcq"
        }))}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  const progressPercentage = Math.round((Object.keys(answers).length / questions.length) * 100) || 0

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{quizData.title}</h1>

      {quizData.description && <p className="text-gray-600 mb-8">{quizData.description}</p>}

      <div className="mb-6">
        <div className="bg-gray-100 rounded-full h-2 mb-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="text-sm text-gray-600 text-right">
          {Object.keys(answers).length}/{questions.length} questions answered
        </div>
      </div>

      <BlanksQuiz quizId={quizData.id} />

      <div className="mt-8 text-center">
        <Button
          onClick={handleSubmitQuiz}
          disabled={!isQuizComplete || isSubmitting}
          variant={isQuizComplete ? "default" : "outline"}
          className="px-6 py-3 transition-all duration-300"
        >
          {isSubmitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              <span>Submitting...</span>
            </>
          ) : (
            "Submit Quiz"
          )}
        </Button>
      </div>
    </div>
  )
}
