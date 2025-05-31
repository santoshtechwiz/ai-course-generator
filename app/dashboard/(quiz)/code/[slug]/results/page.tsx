"use client"

import { use, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { useSession } from "next-auth/react"
import type { AppDispatch } from "@/store"
import { 
  selectQuizResults, 
  selectQuizStatus, 
  selectOrGenerateQuizResults, 
  selectQuizTitle,
  selectAnswers,
  selectQuestions
} from "@/store/slices/quizSlice"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QuizLoadingSteps } from "../../../components/QuizLoadingSteps"
import QuizResult from "../../../components/QuizResult"
import { useSessionService } from "@/hooks/useSessionService"
import { RefreshCw } from "lucide-react"

interface ResultsPageProps {
  params: { slug: string }
}

export default function CodeResultsPage({ params }: ResultsPageProps) {
  const resolvedParams = params instanceof Promise ? use(params) : params
  const slug = resolvedParams.slug
  const searchParams = useSearchParams()
  const fromAuth = searchParams.get("fromAuth") === "true"
  
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { status: authStatus } = useSession()
  const { restoreAuthRedirectState, getStoredResults } = useSessionService()

  // Redux selectors
  const quizResults = useSelector(selectQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const generatedResults = useSelector(selectOrGenerateQuizResults)
  const quizTitle = useSelector(selectQuizTitle)
  const answers = useSelector(selectAnswers)
  const questions = useSelector(selectQuestions)

  // Retrieve stored results from session storage if available
  const storedResults = getStoredResults(slug)
  
  // Use the most authoritative result source
  const resultData = quizResults || generatedResults || storedResults

  // Restore auth state if coming from authentication
  useEffect(() => {
    if (authStatus === "authenticated" && fromAuth) {
      restoreAuthRedirectState()
    }
  }, [authStatus, fromAuth, restoreAuthRedirectState])

  // Redirect to quiz if no results or answers
  useEffect(() => {
    if (authStatus !== "loading" && quizStatus !== "loading") {
      const hasResults = resultData !== null
      const hasAnswers = Object.keys(answers || {}).length > 0
      
      // If we have no results and no answers, redirect back to quiz
      if (!hasResults && !hasAnswers) {
        const redirectTimeout = setTimeout(() => {
          router.push(`/dashboard/code/${slug}`)
        }, 1000)
        
        return () => clearTimeout(redirectTimeout)
      }
    }
  }, [authStatus, quizStatus, resultData, router, slug, answers])
  
  // Handle retaking the quiz
  const handleRetake = () => {
    router.push(`/dashboard/code/${slug}?reset=true`)
  }

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

  // No results state with redirect
  if (!resultData) {
    return (
      <div className="container max-w-4xl py-10 text-center">
        <Card>
          <CardContent className="p-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">No Results Available</h2>
            <p className="text-muted-foreground mb-6">Taking you to the quiz page...</p>
            <Button onClick={() => router.push(`/dashboard/code/${slug}`)}>Take Quiz Now</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show results using the QuizResult component that now handles authentication
  return (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <QuizResult 
            result={resultData} 
            onRetake={handleRetake} 
            quizType="code" 
            slug={slug} 
          />
        </CardContent>
      </Card>
    </div>
  )
}
