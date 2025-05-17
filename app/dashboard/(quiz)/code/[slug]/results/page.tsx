"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useQuiz } from "@/hooks/useQuizState"
import CodeQuizResult from "../../components/CodeQuizResult"
import NonAuthenticatedUserSignInPrompt from "../../../components/NonAuthenticatedUserSignInPrompt"
import { InitializingDisplay, ErrorDisplay } from "../../../components/QuizStateDisplay"
import { QuizResult } from "@/app/types/quiz-types"

interface ResultsPageProps {
  params: {
    slug: string
  }
}

export default function ResultsPage({ params }: ResultsPageProps) {
  const { slug } = params
  const router = useRouter()
  const { userId, isAuthenticated, status } = useAuth()
  
  // Get quiz hook - handle both new and old API formats
  const quizHook = useQuiz()
  
  // Handle both new and old API formats for compatibility
  const isNewApiFormat = quizHook && 'quiz' in quizHook && 'actions' in quizHook
  
  // Extract values from either new or old API
  const quizData = isNewApiFormat ? quizHook.quiz.data : (quizHook as any).quizData
  const results = isNewApiFormat ? quizHook.results : (quizHook as any).results
  const isLoading = isNewApiFormat ? quizHook.status.isLoading : (quizHook as any).isLoading
  const resultsError = isNewApiFormat 
    ? quizHook.status.errorMessage 
    : (quizHook as any).resultsError || (quizHook as any).error
  
  // Get the appropriate getResults function
  const getResults = isNewApiFormat 
    ? quizHook.actions.getResults 
    : (quizHook as any).getResults || (() => Promise.resolve(null))
  
  // Load results if authenticated and not already loaded
  useEffect(() => {
    if (isAuthenticated && !results && !isLoading) {
      getResults(slug).catch(error => {
        console.error("Error loading results:", error)
      })
    }
  }, [slug, isAuthenticated, getResults, isLoading, results])
  
  // Authentication required - immediately show sign in prompt if not authenticated
  // This needs to be the first check BEFORE loading state check
  if (status === 'unauthenticated' || (status !== 'loading' && !isAuthenticated)) {
    return (
      <NonAuthenticatedUserSignInPrompt
        quizType="code"
        onSignIn={() => router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/code/${slug}/results`)}`)}
        showSaveMessage={false}
      />
    )
  }
  
  // Loading state - only show after checking authentication status
  if (isLoading || status === 'loading') {
    return <InitializingDisplay />
  }
  
  // Error state
  if (resultsError) {
    return (
      <ErrorDisplay
        error={resultsError}
        onRetry={() => getResults(slug)}
        onReturn={() => router.push('/dashboard/quizzes')}
      />
    )
  }
  
  // No results found - only after checking authentication and loading
  if (!results && isAuthenticated) {
    return (
      <div className="container max-w-4xl py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">No Results Found</h1>
        <p>We couldn't find your results for this quiz.</p>
        <div className="mt-6">
          <button
            onClick={() => router.push(`/dashboard/code/${slug}`)}
            className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded"
          >
            Take the Quiz
          </button>
        </div>
      </div>
    )
  }
  
  // Display results - only show if authenticated and results exist
  return isAuthenticated && results ? (
    <div className="container max-w-4xl py-6">
      <CodeQuizResult result={results as QuizResult} />
    </div>
  ) : (
    <InitializingDisplay />
  )
}
