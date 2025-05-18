"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useQuiz } from "@/hooks/useQuizState"

import { InitializingDisplay, ErrorDisplay } from "../../components/QuizStateDisplay"
import McqQuizWrapper from "../components/McqQuizWrapper"

export default function McqQuizPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const router = useRouter()
  const { userId, status } = useAuth()

  // Extract slug directly from params instead of using use()
  const { slug } = use(params);

  // Get quiz state from hook
  const quizHook = useQuiz()

  // Handle both old and new API formats for compatibility
  const isNewApiFormat = quizHook && 'quiz' in quizHook && 'actions' in quizHook

  // Extract values from either the new or old API
  const quizData = isNewApiFormat
    ? quizHook.quiz.data
    : (quizHook as any)?.quizData

  const isLoading = isNewApiFormat
    ? quizHook.status.isLoading
    : (quizHook as any)?.isLoading

  const errorMessage = isNewApiFormat
    ? quizHook.status.errorMessage
    : (quizHook as any)?.error || (quizHook as any)?.quizError

  // Get loadQuiz function from either API format
  const loadQuiz = isNewApiFormat
    ? quizHook.actions.loadQuiz
    : (quizHook as any)?.loadQuiz

  // Load quiz from Redux state or API
  useEffect(() => {
    if (!isLoading && !quizData && typeof slug === 'string' && slug && loadQuiz) {
      console.log("Loading quiz with slug:", slug);
      loadQuiz(slug, "mcq")
        .catch(error => {
          console.error("Error loading quiz:", error)
        })
    }
  }, [slug, loadQuiz, isLoading, quizData])

  // If still loading or waiting for auth status, show loading
  if (isLoading || status === "loading") {
    return <InitializingDisplay />
  }

  // Error state
  if (errorMessage) {
    return (
      <ErrorDisplay
        error={errorMessage}
        onRetry={() => window.location.reload()}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  // Quiz found - render the wrapper
  if (quizData) {
    return (
      <div className="container max-w-4xl py-6">
        <McqQuizWrapper
          slug={slug}
          quizId={quizData.id}
          userId={userId}
          quizData={quizData}
          isPublic={quizData.isPublic}
          isFavorite={quizData.isFavorite}
          ownerId={quizData.ownerId}
        />
      </div>
    )
  }

  // Default loading state
  return <InitializingDisplay />
}
