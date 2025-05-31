"use client"

import { use, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { useSession, signIn } from "next-auth/react"
import type { AppDispatch } from "@/store"
import {
  selectQuizResults,
  selectQuizStatus,
  selectOrGenerateQuizResults,
  selectAnswers,
  setQuizResults,
  saveAuthRedirectState, // Ensure this matches the export in quizSlice.ts
  restoreAuthRedirectState,
  clearAuthState,
} from "@/store/slices/quizSlice"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QuizLoadingSteps } from "../../../components/QuizLoadingSteps"
import BlankQuizResults from "../../components/BlankQuizResults"
import { NonAuthenticatedUserSignInPrompt } from "../../../components/EnhancedNonAuthenticatedUserSignInPrompt"

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

  // Redux selectors
  const quizResults = useSelector(selectQuizResults)
  const generatedResults = useSelector(selectOrGenerateQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const answers = useSelector(selectAnswers)

  // Local state for managing the flow
  const [hasRestoredState, setHasRestoredState] = useState(false)

  // Handle authentication state restoration
  useEffect(() => {
    if (authStatus === "authenticated" && fromAuth && !hasRestoredState) {
      const restoredState = dispatch(restoreAuthRedirectState())
      if (restoredState?.quizState?.currentState?.results) {
        dispatch(setQuizResults(restoredState.quizState.currentState.results))
      }
      setHasRestoredState(true)
      dispatch(clearAuthState())
    }
  }, [authStatus, fromAuth, hasRestoredState, dispatch])

  // Redirect to quiz if no results available
  useEffect(() => {
    const hasResults = quizResults || generatedResults
    const hasAnswers = Object.keys(answers || {}).length > 0

    if (authStatus !== "loading" && !hasResults && !hasAnswers && !fromAuth) {
      const redirectTimer = setTimeout(() => {
        router.push(`/dashboard/blanks/${slug}`)
      }, 1000)

      return () => clearTimeout(redirectTimer)
    }
  }, [authStatus, quizResults, generatedResults, answers, router, slug, fromAuth])

  // Handle retaking the quiz
  const handleRetakeQuiz = () => {
    router.push(`/dashboard/blanks/${slug}?reset=true`)
  }

  const handleSignIn = async () => {
    const resultsToSave = quizResults || generatedResults

    if (resultsToSave) {
      dispatch(
        saveAuthRedirectState({
          returnPath: `/dashboard/blanks/${slug}/results?fromAuth=true`,
          quizState: {
            slug,
            quizData: { title: resultsToSave.title, questions: resultsToSave.questions, type: "blanks" },
            currentState: {
              answers,
              showResults: true,
              results: resultsToSave,
            },
          },
        }),
      )
    }

    await signIn(undefined, { callbackUrl: `/dashboard/blanks/${slug}/results?fromAuth=true` })
  }

  // Show loading state while auth is loading or we're checking for results
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
  const resultData = quizResults || generatedResults

  // Show no results message if we still don't have any data
  if (!resultData && Object.keys(answers || {}).length === 0) {
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

  // For unauthenticated users
  if (authStatus !== "authenticated") {
    if (resultData) {
      return (
        <div className="container max-w-4xl py-6">
          <NonAuthenticatedUserSignInPrompt
            onSignIn={handleSignIn}
            resultData={resultData}
            handleRetake={handleRetakeQuiz}
          />

          <div className="mt-6 relative opacity-50 pointer-events-none select-none filter blur-sm">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <BlankQuizResults result={resultData} isAuthenticated={false} slug={slug} onRetake={handleRetakeQuiz} />
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
          message="Please sign in to view your detailed quiz results."
          fallbackAction={{
            label: "Take Quiz Instead",
            onClick: () => router.push(`/dashboard/blanks/${slug}`),
            variant: "outline",
          }}
        />
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
