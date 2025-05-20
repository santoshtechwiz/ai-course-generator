"use client"

import { use, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useQuiz } from "@/hooks/useQuizState"

import { InitializingDisplay, ErrorDisplay } from "../../components/QuizStateDisplay"
import McqQuizWrapper from "../components/McqQuizWrapper"

export default function McqQuizPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string }
}) {
  const router = useRouter()
  const { userId, status } = useAuth()
  const loadStartedRef = useRef(false)

  // Extract slug safely, handling both promise and direct object formats
  const slug = params instanceof Promise 
    ? use(params).slug  // Real usage with Next.js
    : (params as { slug: string }).slug;  // Test usage

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

  // Load quiz from Redux state or API - prevent duplicate calls
  useEffect(() => {
    // Only load if:
    // 1. We have loadQuiz function
    // 2. We're not already loading
    // 3. We don't have quiz data yet
    // 4. We haven't started loading yet (using ref)
    if (loadQuiz && !isLoading && !quizData && !loadStartedRef.current && slug) {
      loadStartedRef.current = true;
      console.log("Loading quiz with slug:", slug);
      loadQuiz(slug, "mcq")
        .catch(error => {
          console.error("Error loading quiz:", error)
          loadStartedRef.current = false; // Reset flag if error occurred to allow retry
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
        onRetry={() => {
          // Reset load flag to allow retry
          loadStartedRef.current = false;
          // Then reload page
          window.location.reload();
        }}
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
