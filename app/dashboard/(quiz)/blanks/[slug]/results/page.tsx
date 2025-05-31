"use client"

import { use, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { useSession } from "next-auth/react"
import type { AppDispatch } from "@/store"
import { Card, CardContent } from "@/components/ui/card"
import {
  selectQuizResults,
  selectQuizStatus,
  selectQuizError,
  selectOrGenerateQuizResults,
  selectQuestions,
  selectAnswers,
  selectQuizTitle,
} from "@/store/slices/quizSlice"
import { selectIsAuthenticated } from "@/store/slices/authSlice"
import { QuizLoadingSteps } from "../../../components/QuizLoadingSteps"
import { NonAuthenticatedUserSignInPrompt } from "../../../components/NonAuthenticatedUserSignInPrompt"
import BlankQuizResults from "../../components/BlankQuizResults"
import { useSessionService } from "@/hooks/useSessionService"
import { RefreshCw } from "lucide-react"

interface ResultsPageProps {
  params: { slug: string }
}

export default function BlanksResultsPage({ params }: ResultsPageProps) {
  const resolvedParams = params instanceof Promise ? use(params) : params
  const slug = resolvedParams.slug
  const searchParams = useSearchParams()
  const fromAuth = searchParams.get("fromAuth") === 'true'

  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { restoreAuthRedirectState, clearQuizResults } = useSessionService()
  const { status: authStatus } = useSession()

  // Redux state
  const quizResults = useSelector(selectQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const quizTitle = useSelector(selectQuizTitle)
  const generatedResults = useSelector(selectOrGenerateQuizResults)

  // Check for auth return after sign-in
  useEffect(() => {
    if (authStatus === "authenticated" && fromAuth) {
      console.log("Authentication detected, restoring quiz state")
      // Restore any saved quiz state from auth redirect
      const restored = restoreAuthRedirectState()
      
      if (restored) {
        sessionStorage.setItem(`${slug}_auth_restored`, 'true')
      }
    }
  }, [authStatus, restoreAuthRedirectState, slug, fromAuth])

  // Clean up function to reset quiz state when navigating away
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && !sessionStorage.getItem(`${slug}_auth_for_results`)) {
        clearQuizResults()
      }
    }
  }, [slug, clearQuizResults])

  // Redirect to quiz if no results available
  useEffect(() => {
    // Skip redirect if we've just restored after auth
    if (typeof window !== "undefined" && sessionStorage.getItem(`${slug}_auth_restored`) === 'true') {
      sessionStorage.removeItem(`${slug}_auth_restored`)
      return
    }
    
    const redirectTimeout = setTimeout(() => {
      const hasResults = quizResults || generatedResults
      const hasAnswers = answers && Object.keys(answers).length > 0
      
      if (!hasResults && !hasAnswers) {
        router.push(`/dashboard/blanks/${slug}`)
      }
    }, 1000)
    
    return () => clearTimeout(redirectTimeout)
  }, [generatedResults, quizResults, answers, router, slug])

  // Handle sign in for unauthenticated users
  const handleSignIn = async () => {
    try {
      sessionStorage.setItem(`${slug}_auth_for_results`, 'true')
      await signIn(undefined, { callbackUrl: `/dashboard/blanks/${slug}/results?fromAuth=true` })
    } catch (error) {
      console.error("Sign in failed:", error)
    }
  }

  // Loading states
  if (authStatus === "loading" || quizStatus === "loading") {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Checking authentication", status: authStatus === "loading" ? "loading" : "completed" },
          { label: "Loading quiz data", status: quizStatus === "loading" ? "loading" : "completed" },
        ]}
      />
    )
  }

  // No results case - redirect to quiz
  if (!quizResults && !generatedResults && Object.keys(answers).length === 0) {
    return (
      <div className="container max-w-4xl py-10 text-center">
        <Card>
          <CardContent className="p-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">No Results Available</h2>
            <p className="text-muted-foreground">Taking you to the quiz page so you can take the quiz...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // For unauthenticated users with results, show the sign-in prompt
  if (!isAuthenticated && (quizResults || generatedResults || Object.keys(answers).length > 0)) {
    return (
      <div className="container max-w-4xl py-6">
        <BlankQuizResults
          result={quizResults || generatedResults}
          isAuthenticated={false}
          slug={slug}
        />
      </div>
    )
  }

  // For authenticated users or users who just completed the quiz
  return (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <BlankQuizResults
            result={quizResults || generatedResults}
            isAuthenticated={isAuthenticated}
            slug={slug}
          />
        </CardContent>
      </Card>
    </div>
  )
}
