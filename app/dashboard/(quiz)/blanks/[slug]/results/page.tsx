"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { useSession, signIn } from "next-auth/react"
import type { AppDispatch } from "@/store"
import {
  selectQuizResults,
  selectQuizStatus,
  selectOrGenerateQuizResults,
  selectAnswers,
  setQuizResults,
} from "@/store/slices/quizSlice"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QuizLoadingSteps } from "../../../components/QuizLoadingSteps"
import BlankQuizResults from "../../components/BlankQuizResults"
import { NonAuthenticatedUserSignInPrompt } from "../../../components/EnhancedNonAuthenticatedUserSignInPrompt"
import { useSessionService } from "@/hooks/useSessionService"
import QuizResult from "../../../components/QuizResult"

interface ResultsPageProps {
  params: Promise<{ slug: string }> | { slug: string }  
}

export default function BlanksResultsPage({ params }: ResultsPageProps) {
  const slug = params instanceof Promise ? use(params) : params.slug;
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { data: session, status: authStatus } = useSession()
  const { restoreAuthRedirectState, clearAuthState } = useSessionService()

  const quizResults = useSelector(selectQuizResults)
  const generatedResults = useSelector(selectOrGenerateQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const answers = useSelector(selectAnswers)

  const [hasRestoredState, setHasRestoredState] = useState(false)

  useEffect(() => {
    if (authStatus === "authenticated" && !hasRestoredState) {
      const restoredState = restoreAuthRedirectState()
      if (restoredState?.quizState?.currentState?.results) {
        dispatch(setQuizResults(restoredState.quizState.currentState.results))
      }
      setHasRestoredState(true)
      clearAuthState()
    }
  }, [authStatus, hasRestoredState, dispatch, restoreAuthRedirectState, clearAuthState])

  useEffect(() => {
    const hasResults = quizResults || generatedResults
    const hasAnswers = Object.keys(answers || {}).length > 0

    if (authStatus !== "loading" && !hasResults && !hasAnswers) {
      const redirectTimer = setTimeout(() => {
        router.push(`/dashboard/blanks/${slug}`)
      }, 1000)

      return () => clearTimeout(redirectTimer)
    }
  }, [authStatus, quizResults, generatedResults, answers, router, slug])

  const handleRetakeQuiz = () => {
    router.push(`/dashboard/blanks/${slug}`)
  }

  const handleSignIn = async () => {
    await signIn()
  }

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

  const resultData = quizResults || generatedResults

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
                <div className="absolute inset-0 flex items-center justify-center" />
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

  // ✅ MISSING CASE FIXED: Authenticated user + results
  return (
    <div className="container max-w-4xl py-10">
      <QuizResult result={resultData} slug={slug} onRetake={handleRetakeQuiz} />
    </div>
  )
}
