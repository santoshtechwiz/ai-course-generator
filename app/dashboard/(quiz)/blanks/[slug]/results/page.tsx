"use client"

import { use, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { useSession } from "next-auth/react"
import type { AppDispatch } from "@/store"
import {
  selectQuizResults,
  selectQuizStatus,
  selectOrGenerateQuizResults,
  selectAnswers,
  fetchQuiz,
} from "@/store/slices/quizSlice"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QuizLoadingSteps } from "../../../components/QuizLoadingSteps"
import BlankQuizResults from "../../components/BlankQuizResults"
import { useSessionService } from "@/hooks/useSessionService"

interface ResultsPageProps {
  params: { slug: string }
}

export default function BlanksResultsPage({ params }: ResultsPageProps) {
  const resolvedParams = params instanceof Promise ? use(params) : params
  const slug = resolvedParams.slug
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const searchParams = useSearchParams()
  const fromAuth = searchParams.get("fromAuth") === "true"

  const { data: session, status: authStatus } = useSession()
  const { restoreAuthRedirectState, getStoredResults, clearAuthRedirectState } = useSessionService()

  // Local state for managing the flow
  const [hasCheckedForResults, setHasCheckedForResults] = useState(false)
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [localResults, setLocalResults] = useState<any>(null)

  // Redux selectors
  const quizResults = useSelector(selectQuizResults)
  const generatedResults = useSelector(selectOrGenerateQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const answers = useSelector(selectAnswers)

  // Determine if we have any results or answers
  const hasResults = !!(quizResults || generatedResults || localResults)
  const hasAnswers = Object.keys(answers).length > 0
  const hasAnyData = hasResults || hasAnswers

  // Handle authentication state restoration
  useEffect(() => {
    if (authStatus === "authenticated" && fromAuth) {
      const restoredState = restoreAuthRedirectState()
      if (restoredState?.quizState?.currentState?.results) {
        setLocalResults(restoredState.quizState.currentState.results)
      }
      clearAuthRedirectState()
    }
  }, [authStatus, fromAuth, restoreAuthRedirectState, clearAuthRedirectState])

  // Check for stored results when component mounts
  useEffect(() => {
    if (!hasCheckedForResults) {
      const storedResults = getStoredResults(slug)
      if (storedResults) {
        setLocalResults(storedResults)
      }
      setHasCheckedForResults(true)
    }
  }, [slug, getStoredResults, hasCheckedForResults])

  // Handle redirect logic when no data is available
  useEffect(() => {
    // Only check for redirect after auth status is determined and we've checked for results
    if (authStatus !== "loading" && hasCheckedForResults && !hasAnyData && !localResults) {
      // Set a small delay to prevent immediate redirect and allow for any async data loading
      const redirectTimer = setTimeout(() => {
        setShouldRedirect(true)
      }, 1000)

      return () => clearTimeout(redirectTimer)
    }
  }, [authStatus, hasCheckedForResults, hasAnyData, localResults])

  // Perform the redirect
  useEffect(() => {
    if (shouldRedirect) {
      router.push(`/dashboard/blanks/${slug}`)
    }
  }, [shouldRedirect, router, slug])

  // Try to fetch quiz data if authenticated and no results
  useEffect(() => {
    if (
      authStatus === "authenticated" &&
      hasCheckedForResults &&
      !hasAnyData &&
      !localResults &&
      quizStatus !== "loading"
    ) {
      dispatch(fetchQuiz({ slug, type: "blanks" }))
    }
  }, [authStatus, hasCheckedForResults, hasAnyData, localResults, quizStatus, dispatch, slug])

  // Handle retaking the quiz
  const handleRetakeQuiz = () => {
    router.push(`/dashboard/blanks/${slug}?reset=true`)
  }

  // Show loading state while auth is loading or we're checking for results
  if (authStatus === "loading" || !hasCheckedForResults || quizStatus === "loading") {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Checking authentication", status: authStatus === "loading" ? "loading" : "completed" },
          {
            label: "Loading quiz results",
            status: !hasCheckedForResults || quizStatus === "loading" ? "loading" : "completed",
          },
        ]}
      />
    )
  }

  // Show loading while redirect is being prepared
  if (shouldRedirect) {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "No results found", status: "completed" },
          { label: "Redirecting to quiz", status: "loading" },
        ]}
      />
    )
  }

  // Determine which results to show
  const resultData = localResults || quizResults || generatedResults

  // Show no results message if we still don't have any data
  if (!resultData && !hasAnswers) {
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
          <BlankQuizResults
            result={resultData}
            isAuthenticated={authStatus === "authenticated"}
            slug={slug}
            onRetake={handleRetakeQuiz}
          />
        </CardContent>
      </Card>
    </div>
  )
}
