"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"


import NonAuthenticatedUserSignInPrompt from "../../../components/NonAuthenticatedUserSignInPrompt"
import { InitializingDisplay, ErrorDisplay } from "../../../components/QuizStateDisplay"
import { QuizResult } from "@/app/types/quiz-types"
import { useQuiz } from "@/hooks"
import McqQuizResult from "../../components/McqQuizResult"

interface ResultsPageProps {
   params: Promise<{ slug: string }>
}

export default function ResultsPage({ params }: ResultsPageProps) {
  // Use direct destructuring to avoid use() which causes issues in tests
  const slug = use(params);
  const router = useRouter()
  const { userId, isAuthenticated, status, requireAuth } = useAuth()
  
  // Get quiz using the new hook API
  const { quiz, results, status: quizStatus, actions } = useQuiz()
  
  // Authentication and results loading
  useEffect(() => {
    // Skip if we're still loading auth status
    if (status === 'loading') return
    
    let isMounted = true
    
    // If authenticated, load results if needed
    if (isAuthenticated) {
      if (!results && !quizStatus?.isLoading) {
        // Safely check if getResults exists and is a function
        if (actions?.getResults && typeof actions.getResults === 'function') {
          try {
            // Make sure we're using the MCQ-specific endpoint
            const fetchPromise = actions.getResults(slug, "mcq"); // Add type parameter
            if (fetchPromise && typeof fetchPromise.catch === 'function') {
              fetchPromise.catch(error => {
                if (isMounted) {
                  console.error("Error loading MCQ results:", error)
                }
              });
            }
          } catch (error) {
            if (isMounted) {
              console.error("Error calling getResults:", error)
            }
          }
        }
      }
    }
    
    return () => {
      isMounted = false
    }
  }, [slug, isAuthenticated, actions, quizStatus?.isLoading, results, status])
  
  // First check auth to maintain correct test behavior
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
  if (quizStatus?.isLoading || status === 'loading') {
    return <InitializingDisplay />
  }
  
  // Error state
  if (quizStatus?.errorMessage) {
    return (
      <ErrorDisplay
        error={quizStatus.errorMessage}
        onRetry={() => actions?.getResults && actions.getResults(slug)}
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
      <McqQuizResult result={results as QuizResult} />
    </div>
  ) : (
    <InitializingDisplay />
  )
}
