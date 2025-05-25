"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/store"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent } from "@/components/ui/card"
import { selectQuizResults } from "@/store/slices/quizSlice"
import NonAuthenticatedUserSignInPrompt from "../../components/NonAuthenticatedUserSignInPrompt"
import { InitializingDisplay, ErrorDisplay } from "../../components/QuizStateDisplay"
import McqQuizResult from "./McqQuizResult"

interface McqResultsClientProps {
  slug: string
}

export default function McqResultsClient({ slug }: McqResultsClientProps) {
  const router = useRouter()
  const { isAuthenticated, status, requireAuth } = useAuth()
  const [loadError, setLoadError] = useState<string | null>(null)
  const [fetchAttempted, setFetchAttempted] = useState(false)
  const [resultsData, setResultsData] = useState<any>(null)
  
  // Get results from Redux store
  const quizResults = useAppSelector(selectQuizResults)

  // Load results if not already in store
  useEffect(() => {
    const loadResults = async () => {
      // If we already have results in Redux, use them
      if (quizResults) {
        return
      }
      
      // Otherwise try to fetch from API
      if (isAuthenticated && !fetchAttempted) {
        setFetchAttempted(true)
        
        try {
          const response = await fetch(`/api/quizzes/mcq/${slug}/results`)
          
          if (!response.ok) {
            throw new Error('Failed to load results')
          }
          
          const data = await response.json()
          setResultsData(data)
        } catch (error) {
          console.error("Error loading results:", error)
          setLoadError("Failed to load quiz results")
        }
      }
    }
    
    loadResults()
  }, [isAuthenticated, quizResults, fetchAttempted, slug])

  // Authentication check
  if (!isAuthenticated && status !== "loading") {
    return (
      <NonAuthenticatedUserSignInPrompt
        quizType="mcq"
        onSignIn={() => requireAuth(`/dashboard/mcq/${slug}/results`)}
        showSaveMessage={false}
        message="Please sign in to view your quiz results"
      />
    )
  }

  // Loading state
  if (status === "loading") {
    return <InitializingDisplay message="Preparing your results..." />
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

  // Use results from Redux or from API
  const displayResults = quizResults || resultsData

  // No results found
  if (!displayResults && isAuthenticated && fetchAttempted) {
    return (
      <div className="container max-w-4xl py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">No Results Found</h1>
        <p>We couldn't find your results for this quiz.</p>
        <div className="mt-6">
          <button
            onClick={() => router.push(`/dashboard/mcq/${slug}`)}
            className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded"
          >
            Take the Quiz
          </button>
        </div>
      </div>
    )
  }

  // Display results if we have them
  return displayResults ? (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <McqQuizResult result={displayResults} />
      </CardContent>
    </Card>
  ) : (
    <InitializingDisplay message="Preparing your quiz results..." />
  )
}
