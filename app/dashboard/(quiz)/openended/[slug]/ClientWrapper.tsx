"use client"

import { useSelector, useDispatch } from "react-redux"
import { resetQuiz } from "@/store/slices/quizSlice" 
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import OpenEndedQuizWrapperRedux from "../components/OpenEndedQuizWrapperRedux"
import { LoadingDisplay } from "../../components/QuizStateDisplay"
import type { OpenEndedQuizData } from "@/types/quiz"
import { ErrorBoundary } from "react-error-boundary"
import { ErrorDisplay } from "../../components/QuizStateDisplay"
import { AppDispatch } from "@/store"

export function ClientWrapper({ slug, quizData }: { slug: string; quizData: OpenEndedQuizData }) {
  const dispatch = useDispatch<AppDispatch>()
  const searchParams = useSearchParams()
  const reset = searchParams.get("reset")
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (reset === "true") {
      // Reset the quiz state when reset param is present
      dispatch(resetQuiz())
    }

    // Set a small delay to ensure the component is fully mounted
    // and the Redux store is accessible
    const timer = setTimeout(() => setIsReady(true), 100)
    return () => clearTimeout(timer)
  }, [reset, dispatch])

  // Add error handling for quiz data
  if (!quizData || !quizData.id || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
    return (
      <ErrorDisplay
        error="Invalid quiz data. Please try again later."
        onRetry={() => window.location.reload()}
        onReturn={() => (window.location.href = "/dashboard/quizzes")}
      />
    )
  }

  if (!isReady) {
    return <LoadingDisplay message="Preparing your quiz..." />
  }

  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => (
        <ErrorDisplay
          error={`An unexpected error occurred: ${error.message}`}
          onRetry={() => window.location.reload()}
          onReturn={() => (window.location.href = "/dashboard/quizzes")}
        />
      )}
    >
      <OpenEndedQuizWrapperRedux 
        slug={slug}
        quizData={quizData} 
        quizId={quizData.id}
      />
    </ErrorBoundary>
  )
}
