"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

import CodeQuizResult from "../../components/CodeQuizResult"
import NonAuthenticatedUserSignInPrompt from "../../../components/NonAuthenticatedUserSignInPrompt"
import { InitializingDisplay, ErrorDisplay } from "../../../components/QuizStateDisplay"
import { QuizResult } from "@/app/types/quiz-types"
import { useQuiz } from "@/hooks"

interface ResultsPageProps {
   params: Promise<{ slug: string }>
}

export default function ResultsPage({ params }: ResultsPageProps) {
  // Use direct destructuring to avoid use() which causes issues in tests
const { slug } = use(params);
  const router = useRouter()
  const { userId, isAuthenticated, status, requireAuth } = useAuth()
  
  // Get quiz hook
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
  
  // Authentication and results loading
  useEffect(() => {
    // Skip if we're still loading auth status
    if (status === 'loading') return
    
    // If authenticated, load results if needed
    if (isAuthenticated) {
      if (!results && !isLoading) {
        getResults(slug).catch(error => {
          console.error("Error loading results:", error)
        })
      }
    }
  }, [slug, isAuthenticated, getResults, isLoading, results, status])
  
  // First check auth to maintain correct test behavior
  // This is a critical change for test compatibility - this must be the first condition
  if (!isAuthenticated && status !== 'loading') {
    return (
      <NonAuthenticatedUserSignInPrompt
        quizType="code"
        onSignIn={() => requireAuth(`/dashboard/code/${slug}/results`)}
        showSaveMessage={false}
        message="Please sign in to view your quiz results"
      />
    )
  }
  
  // Keep loading after auth check for test compatibility
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
  
  // Display results - only if authenticated and results exist
  return results ? (
    <div className="container max-w-4xl py-6">
      <CodeQuizResult result={results as QuizResult} />
    </div>
  ) : (
    <InitializingDisplay />
  )
}
