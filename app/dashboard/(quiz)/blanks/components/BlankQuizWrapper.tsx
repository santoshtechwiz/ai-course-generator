"use client"

import type React from "react"
import { useEffect } from "react"

import { useRouter } from "next/navigation"
import { BlanksQuiz } from "./BlanksQuiz"
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
} from "@/store/slices/quizSlice"
import { ErrorDisplay } from "../../components/QuizStateDisplay"
import { useAppDispatch, useAppSelector } from "@/store"

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

  const questions = useAppSelector(selectQuestions)
  const answers = useAppSelector(selectAnswers)
  const status = useAppSelector(selectQuizStatus)
  const error = useAppSelector(selectQuizError)
  const isQuizComplete = useAppSelector(selectIsQuizComplete)
  const results = useAppSelector(selectQuizResults)

  // Initialize quiz data
  useEffect(() => {
    if (quizData) {
      dispatch(setQuizId(quizData.id))
      dispatch(setQuizType("blanks"))
      dispatch(fetchQuiz(quizData.id))
    }
  }, [dispatch, quizData])

  // Handle quiz submission
  const handleSubmitQuiz = async () => {
    if (isQuizComplete) {
      await dispatch(submitQuiz())
      router.push(`/dashboard/blanks/${slug}/results`)
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
        onRetry={() => dispatch(fetchQuiz(quizData?.id ))}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{quizData.title}</h1>

      {quizData.description && <p className="text-gray-600 mb-8">{quizData.description}</p>}

      <div className="mb-6">
        <div className="bg-gray-100 rounded-full h-2 mb-2">
          <div
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
          ></div>
        </div>
        <div className="text-sm text-gray-600 text-right">
          {Object.keys(answers).length}/{questions.length} questions answered
        </div>
      </div>

      <BlanksQuiz quizId={quizData.id} questions={[]} currentQuestionIndex={0} answers={undefined} />

      <div className="mt-8 text-center">
        <button
          onClick={handleSubmitQuiz}
          disabled={!isQuizComplete}
          className={`px-6 py-3 rounded-lg ${
            isQuizComplete
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Submit Quiz
        </button>
      </div>
    </div>
  )
}
