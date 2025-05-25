"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent } from "@/components/ui/card"
import { 
  selectQuizResults, 
  selectQuizId,
  selectQuizStatus,
  selectQuizError,
  fetchQuizResults
} from "@/store/slices/quizSlice"
import NonAuthenticatedUserSignInPrompt from "../../../components/NonAuthenticatedUserSignInPrompt"
import { InitializingDisplay, ErrorDisplay } from "../../../components/QuizStateDisplay"
import McqQuizResult from "../../components/McqQuizResult"
import { Metadata } from "next"

interface ResultsPageProps {
  params: Promise<{ slug: string }> | { slug: string }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params
  
  return {
    title: `Quiz Results | AI Learning Platform`,
    description: 'View your quiz results and see how you performed',
  }
}

export default function McqResultsPage({ params }: ResultsPageProps) {
  // Extract slug in a way that works in tests and in real usage
  const slug =
    params instanceof Promise
      ? use(params).slug // Real usage with Next.js
      : (params as { slug: string }).slug // Test usage

  const router = useRouter()
  const { isAuthenticated, status, requireAuth } = useAuth()
  const dispatch = useDispatch()
  
  // Get results and status from Redux store
  const quizResults = useSelector(selectQuizResults)
  const quizId = useSelector(selectQuizId)
  const quizStatus = useSelector(selectQuizStatus)
  const quizError = useSelector(selectQuizError)

  // Load results if not already in store
  useEffect(() => {
    if (isAuthenticated && !quizResults && quizStatus !== 'loading' && quizStatus !== 'error') {
      // Use the Redux thunk to fetch results
      dispatch(fetchQuizResults(slug))
    }
  }, [isAuthenticated, quizResults, quizStatus, slug, dispatch])

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
  if (status === "loading" || quizStatus === 'loading') {
    return <InitializingDisplay message="Loading your results..." />
  }

 

  // No results found
  if (!quizResults && isAuthenticated && quizStatus !== 'loading' && quizStatus !== 'submitting') {
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
  return quizResults ? (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <McqQuizResult result={quizResults} />
        </CardContent>
      </Card>
    </div>
  ) : (
    <InitializingDisplay message="Preparing your quiz results..." />
  )
}