"use client"

import { use, useEffect } from "react"
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

export default function ResultsPage({ params:paramsPromise }: ResultsPageProps) {
  const { slug } = use(paramsPromise);
  const router = useRouter()
  const { userId, isAuthenticated, status } = useAuth()
  const { 
    quizData, 
    results, 
    isLoading, 
    resultsError,
    getResults
  } = useQuiz()
  
  // Load results if authenticated
  useEffect(() => {
    if (isAuthenticated && !results && !isLoading) {
      getResults(slug).catch(error => {
        console.error("Error loading results:", error)
      })
    }
  }, [slug, isAuthenticated, getResults, isLoading, results])
  
  // Loading state
  if (isLoading || status === 'loading') {
    return <InitializingDisplay />
  }
  
  // Authentication required
  if (!isAuthenticated) {
    return (
      <NonAuthenticatedUserSignInPrompt
        quizType="code"
        onSignIn={() => router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/code/${slug}/results`)}`)}
        showSaveMessage={false}
      />
    )
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
  
  // No results found
  if (!results) {
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
  
  // Display results using the correct component (CodeQuizResult)
  return (
    <div className="container max-w-4xl py-6">
      <CodeQuizResult result={results as QuizResult} />
    </div>
  )
}
