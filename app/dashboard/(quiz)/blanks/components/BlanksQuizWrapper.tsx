"use client"

import { useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import {
  fetchQuiz,
  setCurrentQuestionIndex,
  submitQuiz,
  selectQuestions,
  selectAnswers,
  selectQuizStatus,
  selectQuizError,
  selectIsQuizComplete,
  selectQuizResults,
  selectQuizTitle,
} from "@/store/slices/quizSlice"
import { BlanksQuiz } from "./BlanksQuiz"
import { QuizLoadingSteps } from "../../components/QuizLoadingSteps"
import { Button } from "@/components/ui/button"

interface BlankQuizWrapperProps {
  slug: string;
}

export default function BlankQuizWrapper({ slug }: BlankQuizWrapperProps) {
  const dispatch = useDispatch()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Redux state
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const status = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const isQuizComplete = useSelector(selectIsQuizComplete)
  const results = useSelector(selectQuizResults)
  const title = useSelector(selectQuizTitle)
  const currentQuestionIndex = useSelector((state: any) => state.quiz.currentQuestionIndex)

  // Fetch quiz data from API via slice
  useEffect(() => {
    if (slug) {
      dispatch(fetchQuiz({ id: slug, type: "blanks" }))
    }
  }, [slug, dispatch])

  // Handle reset parameter
  useEffect(() => {
    if (searchParams?.get("reset") === "true") {
      dispatch(setCurrentQuestionIndex(0))
    }
  }, [searchParams, dispatch])

  // Handle quiz submission
  const handleSubmitQuiz = useCallback(async () => {
    if (isQuizComplete) {
      try {
        await dispatch(submitQuiz()).unwrap()
        router.push(`/dashboard/blanks/${slug}/results`)
      } catch {
        // error handled by slice
      }
    }
  }, [dispatch, router, slug, isQuizComplete])

  // Loading state
  if (status === "loading") {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Fetching quiz data", status: "loading" },
          { label: "Preparing questions", status: "pending" },
        ]}
      />
    )
  }

  // Error state
  if (status === "error" || error) {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Fetching quiz data", status: "error", errorMsg: error || "Failed to load quiz" },
        ]}
      />
    )
  }

  // No questions
  if (!questions || questions.length === 0) {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "No questions available for this quiz", status: "error", errorMsg: "This quiz doesn't contain any questions. Please try another quiz." }
        ]}
      />
    )
  }

  const progressPercentage = Math.round((Object.keys(answers).length / questions.length) * 100) || 0

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{title}</h1>

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

      <BlanksQuiz />

      <div className="mt-8 text-center">
        <Button
          onClick={handleSubmitQuiz}
          disabled={!isQuizComplete || status === "submitting"}
          className="px-6 py-3 transition-all duration-300"
          variant={isQuizComplete ? "default" : "outline"}
        >
          {status === "submitting" ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
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
