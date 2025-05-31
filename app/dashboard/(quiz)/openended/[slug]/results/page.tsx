"use client"

import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { useSession } from "next-auth/react"
import type { AppDispatch } from "@/store"
import { selectQuizResults, selectQuizStatus, selectOrGenerateQuizResults, fetchQuiz } from "@/store/slices/quizSlice"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QuizLoadingSteps } from "../../../components/QuizLoadingSteps"
import { useSessionService } from "@/hooks/useSessionService"
import OpenEndedQuizResults from "../../components/QuizResultsOpenEnded"

interface ResultsPageProps {
  params: { slug: string }
}

export default function OpenEndedResultsPage({ params }: ResultsPageProps) {
  const resolvedParams = params instanceof Promise ? use(params) : params
  const slug = resolvedParams.slug
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { data: session, status: authStatus } = useSession()
  const { restoreAuthRedirectState, getStoredResults } = useSessionService()

  // Redux selectors
  const quizResults = useSelector(selectQuizResults)
  const generatedResults = useSelector(selectOrGenerateQuizResults)
  const quizStatus = useSelector(selectQuizStatus)

  // Use either stored results or generated results
  const resultData = quizResults || generatedResults || getStoredResults(slug)

  // Restore auth state if coming from authentication
  useEffect(() => {
    if (authStatus === "authenticated") {
      restoreAuthRedirectState()
    }
  }, [authStatus, restoreAuthRedirectState])

  // Redirect to quiz if no results
  useEffect(() => {
    if (authStatus !== "loading" && !resultData && quizStatus !== "loading") {
      router.push(`/dashboard/openended/${slug}`)
    }
  }, [authStatus, resultData, quizStatus, router, slug])

  // Handle retaking the quiz
  const handleRetakeQuiz = () => {
    router.push(`/dashboard/openended/${slug}?reset=true`)
  }

  // Add this effect to fetch quiz data if needed
  useEffect(() => {
    // If we don't have results and we're authenticated, try to fetch the quiz
    if (!resultData && authStatus === "authenticated" && quizStatus !== "loading") {
      dispatch(fetchQuiz({ slug, type: "openended" }))
    }
  }, [resultData, authStatus, quizStatus, dispatch, slug])

  // Loading state
  if (authStatus === "loading" || quizStatus === "loading") {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Checking authentication", status: authStatus === "loading" ? "loading" : "completed" },
          { label: "Loading quiz results", status: quizStatus === "loading" ? "loading" : "completed" },
        ]}
      />
    )
  }

  // Error state - no results found
  if (!resultData) {
    return (
      <div className="container max-w-4xl py-10 text-center">
        <Card>
          <CardContent className="p-8">
            <h2 className="text-xl font-semibold mb-2">No Results Available</h2>
            <p className="text-muted-foreground mb-6">You need to complete the quiz to see results.</p>
            <Button onClick={handleRetakeQuiz}>Take Quiz Now</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show results
  return (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <OpenEndedQuizResults
            result={resultData}
            isAuthenticated={!!session?.user}
            slug={slug}
            onRetake={handleRetakeQuiz}
          />
        </CardContent>
      </Card>
    </div>
  )
}
