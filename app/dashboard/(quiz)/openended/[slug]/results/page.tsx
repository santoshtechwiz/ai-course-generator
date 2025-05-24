"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent } from "@/components/ui/card"
import { selectQuizResults, selectQuizId } from "@/store/slices/quizSlice"
import NonAuthenticatedUserSignInPrompt from "../../../components/NonAuthenticatedUserSignInPrompt"
import { InitializingDisplay, ErrorDisplay } from "../../../components/QuizStateDisplay"
import QuizResultsOpenEnded from "../../components/QuizResultsOpenEnded"

interface ResultsPageProps {
  params: Promise<{ slug: string }> | { slug: string }
}

export default function OpenEndedResultsPage({ params }: ResultsPageProps) {
  // Extract slug in a way that works in tests and in real usage
  const slug =
    params instanceof Promise
      ? use(params).slug // Real usage with Next.js
      : (params as { slug: string }).slug // Test usage

  const router = useRouter()
  const { isAuthenticated, status, requireAuth } = useAuth()
  const [loadError, setLoadError] = useState<string | null>(null)
  const [fetchAttempted, setFetchAttempted] = useState(false)
  
  // Get results from Redux store
  const quizResults = useSelector(selectQuizResults)
  const quizId = useSelector(selectQuizId)

  // Load results if not already in store
  useEffect(() => {
    if (isAuthenticated && !quizResults && !fetchAttempted) {
      setFetchAttempted(true)
      
      const fetchResults = async () => {
        try {
          const response = await fetch(`/api/quizzes/openended/${slug}/results`)
          
          if (!response.ok) {
            throw new Error('Failed to load results')
          }
          
          // In a real app, you would dispatch an action to store these results
          const data = await response.json()
          console.log("Results fetched:", data)
          
          // Here we would dispatch to store the data
          // dispatch(setQuizResults(data))
        } catch (error) {
          console.error("Error loading results:", error)
          setLoadError("Failed to load quiz results")
        }
      }
      
      fetchResults()
    }
  }, [isAuthenticated, quizResults, fetchAttempted, slug])
  
  // Authentication check
  if (!isAuthenticated && status !== "loading") {
    return (
      <NonAuthenticatedUserSignInPrompt
        quizType="openended"
        onSignIn={() => requireAuth(`/dashboard/openended/${slug}/results`)}
        showSaveMessage={false}
        message="Please sign in to view your quiz results"
      />
    )
  }

  // Loading state
  if (status === "loading") {
    return <InitializingDisplay />
  }

  // Error state
  if (loadError) {
    return (
      <ErrorDisplay
        error={loadError}
        onRetry={() => {
          setFetchAttempted(false)
          setLoadError(null)
        }}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  // No results found
  if (!quizResults && isAuthenticated && fetchAttempted) {
    return (
      <div className="container max-w-4xl py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">No Results Found</h1>
        <p>We couldn't find your results for this quiz.</p>
        <div className="mt-6">
          <button
            onClick={() => router.push(`/dashboard/openended/${slug}`)}
            className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded"
          >
            Take the Quiz
          </button>
        </div>
      </div>
    )
  }

  // Display results if we have them
  return quizResults ? (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <QuizResultsOpenEnded result={quizResults} />
        </CardContent>
      </Card>
    </div>
  ) : (
    <InitializingDisplay message="Preparing your quiz results..." />
  )
}
