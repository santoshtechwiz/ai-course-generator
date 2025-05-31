"use client"

import { use, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { useSession, signIn } from "next-auth/react"
import type { AppDispatch } from "@/store"
import { 
  selectQuizResults, 
  selectQuizStatus, 
  selectOrGenerateQuizResults, 
  selectQuizTitle,
  selectAnswers,
  selectQuestions
} from "@/store/slices/quizSlice"
import { selectIsAuthenticated } from "@/store/slices/authSlice"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QuizLoadingSteps } from "../../../components/QuizLoadingSteps"
import QuizResult from "../../../components/QuizResult"
import { useSessionService } from "@/hooks/useSessionService"
import { Check, RefreshCw } from "lucide-react"

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
  const { data: session, status: authStatus } = useSession()
  const { saveAuthRedirectState, restoreAuthRedirectState, getStoredResults } = useSessionService()

  // Redux selectors
  const quizResults = useSelector(selectQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const isAuthenticated = useSelector(selectIsAuthenticated)
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
  
  // Handle signing in for unauthenticated users
  const handleSignIn = async () => {
    // Save state for restoration after authentication
    saveAuthRedirectState({
      returnPath: `/dashboard/code/${slug}/results?fromAuth=true`,
      quizState: {
        slug,
        quizData: {
          title: quizTitle,
          questions,
        },
        currentState: {
          answers,
          showResults: true,
          results: resultData,
        },
      },
    })
    
    await signIn(undefined, { callbackUrl: `/dashboard/code/${slug}/results?fromAuth=true` })
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
            <h2 className="text-xl font-semibold mb-2">No Results Available</h2>
            <p className="text-muted-foreground mb-6">You need to complete the quiz to see results.</p>
            <Button onClick={() => router.push(`/dashboard/code/${slug}`)}>Take Quiz Now</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Unauthenticated user view with limited results
  if (!isAuthenticated) {
    return (
      <div className="container max-w-4xl py-6">
        <Card className="mb-6 bg-gradient-to-b from-background to-primary/10 border-primary/20">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold mb-3">Your Score: {resultData.percentage}%</h2>
            <p className="text-muted-foreground mb-6">
              Sign in to see your detailed results, save your progress, and track your improvement over time.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={handleSignIn} size="lg">
                Sign In to See Full Results
              </Button>
              <Button variant="outline" onClick={handleRetake} size="lg">
                Retake Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="bg-muted/30 p-6 rounded-lg border border-muted mb-6">
              <h3 className="text-lg font-medium mb-2 text-center">Why Sign In?</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>See which questions you answered correctly</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Review detailed explanations for all answers</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Track your progress across all quizzes</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Authenticated user full results view
  return (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <QuizResult result={resultData} onRetake={handleRetake} quizType="code" />
        </CardContent>
      </Card>
    </div>
  )
}
