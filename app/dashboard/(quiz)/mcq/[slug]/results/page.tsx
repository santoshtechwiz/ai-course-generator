"use client"

import { use, useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { signIn, useSession } from "next-auth/react"
import type { AppDispatch } from "@/store"
import { Card, CardContent } from "@/components/ui/card"
import {
  selectQuizResults,
  selectQuizStatus,
  selectQuestions,
  selectAnswers,
  selectQuizTitle,
  selectOrGenerateQuizResults,
  setQuizResults,
} from "@/store/slices/quizSlice"
import { QuizLoadingSteps } from "../../../components/QuizLoadingSteps"
import { NonAuthenticatedUserSignInPrompt } from "../../../components/NonAuthenticatedUserSignInPrompt"
import QuizResult from "../../../components/QuizResult"
import { useSessionService } from "@/hooks/useSessionService"
import { RefreshCw } from "lucide-react"

interface ResultsPageProps {
  params: { slug: string }
}

// Replace the entire component logic with this improved version:
export default function McqResultsPage({ params }: ResultsPageProps) {
  const resolvedParams = params instanceof Promise ? use(params) : params
  const slug = resolvedParams.slug
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const searchParams = useSearchParams()
  const fromAuth = searchParams.get("fromAuth") === "true"

  const { data: session, status: authStatus } = useSession()
  const { restoreAuthRedirectState, getStoredResults, clearAuthState, saveAuthRedirectState } = useSessionService()

  // Redux selectors
  const quizResults = useSelector(selectQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const generatedResults = useSelector(selectOrGenerateQuizResults)
  const quizTitle = useSelector(selectQuizTitle)
  const answers = useSelector(selectAnswers)
  const questions = useSelector(selectQuestions)

  // Local state
  const [localResults, setLocalResults] = useState<any>(null)
  const [hasRestoredState, setHasRestoredState] = useState(false)

  // Handle authentication state restoration
  useEffect(() => {
    if (authStatus === "authenticated" && fromAuth && !hasRestoredState) {
      const restoredState = restoreAuthRedirectState()
      if (restoredState?.quizState?.currentState?.results) {
        setLocalResults(restoredState.quizState.currentState.results)
        dispatch(setQuizResults(restoredState.quizState.currentState.results))
      }
      setHasRestoredState(true)
      clearAuthState()
    }
  }, [authStatus, fromAuth, hasRestoredState, restoreAuthRedirectState, clearAuthState, dispatch])

  // Check for stored results
  useEffect(() => {
    if (!localResults && !quizResults && !generatedResults) {
      const storedResults = getStoredResults(slug)
      if (storedResults) {
        setLocalResults(storedResults)
      }
    }
  }, [slug, getStoredResults, localResults, quizResults, generatedResults])

  // Redirect to quiz if no results available
  useEffect(() => {
    const hasResults = quizResults || generatedResults || localResults
    const hasAnswers = Object.keys(answers || {}).length > 0

    if (authStatus !== "loading" && !hasResults && !hasAnswers && !fromAuth) {
      const redirectTimer = setTimeout(() => {
        router.push(`/dashboard/mcq/${slug}`)
      }, 1000)

      return () => clearTimeout(redirectTimer)
    }
  }, [authStatus, quizResults, generatedResults, localResults, answers, router, slug, fromAuth])

  const handleRetake = useCallback(() => {
    router.push(`/dashboard/mcq/${slug}?reset=true`)
  }, [router, slug])

  const handleSignIn = useCallback(async () => {
    const resultsToSave = quizResults || generatedResults || localResults

    if (resultsToSave) {
      saveAuthRedirectState({
        returnPath: `/dashboard/mcq/${slug}/results?fromAuth=true`,
        quizState: {
          slug,
          quizData: { title: quizTitle, questions, type: "mcq" },
          currentState: {
            answers,
            showResults: true,
            results: resultsToSave,
          },
        },
      })

      sessionStorage.setItem(`quiz_results_${slug}`, JSON.stringify(resultsToSave))
    }

    await signIn(undefined, { callbackUrl: `/dashboard/mcq/${slug}/results?fromAuth=true` })
  }, [saveAuthRedirectState, slug, quizTitle, questions, answers, generatedResults, quizResults, localResults])

  // Loading states
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

  // Determine which results to show
  const resultData = localResults || quizResults || generatedResults

  // No results case
  if (!resultData && Object.keys(answers || {}).length === 0) {
    return (
      <div className="container max-w-4xl py-10 text-center">
        <Card>
          <CardContent className="p-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">No Results Available</h2>
            <p className="text-muted-foreground">Taking you to the quiz page...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // For unauthenticated users, show sign-in prompt with limited results
  if (authStatus !== "authenticated") {
    if (resultData) {
      return (
        <div className="container max-w-4xl py-6">
          <NonAuthenticatedUserSignInPrompt
            onSignIn={handleSignIn}
            resultData={resultData}
            handleRetake={handleRetake}
          />

          <div className="mt-6 relative opacity-50 pointer-events-none select-none filter blur-sm">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <QuizResult result={resultData} onRetake={handleRetake} quizType="mcq" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-primary/90 text-white px-6 py-3 rounded-lg shadow-lg">
                    Sign in to view detailed results
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    return (
      <div className="container max-w-md py-10">
        <NonAuthenticatedUserSignInPrompt
          onSignIn={handleSignIn}
          title="Sign In to View Results"
          message="Please sign in to view your detailed quiz results and track your progress over time."
          fallbackAction={{
            label: "Take Quiz Instead",
            onClick: () => router.push(`/dashboard/mcq/${slug}`),
            variant: "outline",
          }}
        />
      </div>
    )
  }

  // For authenticated users, show full results
  return (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <QuizResult result={resultData} onRetake={handleRetake} quizType="mcq" />
        </CardContent>
      </Card>
    </div>
  )
}
