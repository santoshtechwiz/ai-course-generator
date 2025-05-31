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
import NonAuthenticatedUserSignInPrompt from "../../../components/EnhancedNonAuthenticatedUserSignInPrompt"

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

  // For unauthenticated users, show the sign-in prompt with limited results
  if (!isAuthenticated) {
    // If we have results, show a teaser of results with limited information
    if (resultData && Object.keys(resultData).length > 0) {
      console.log("Showing limited Code results for unauthenticated user");
      
      // Create a limited version of results that hides specific answers
      const limitedResultData = {
        ...resultData,
        // Remove detailed question data
        questions: undefined,
        // Only show overall score and limited question results
        questionResults: resultData.questionResults?.map(q => ({
          ...q,
          correctAnswer: undefined, // Hide correct answers
          isCorrect: undefined      // Hide which ones were correct/incorrect
        })),
        // Keep core stats
        score: resultData.score,
        maxScore: resultData.maxScore,
        percentage: resultData.percentage
      };

      return (
        <div className="container max-w-4xl py-6">
          <NonAuthenticatedUserSignInPrompt
            onSignIn={handleSignIn}
            previewData={resultData}
            title="Sign In to View Full Results"
            quizType="code"
          />
            
          {/* Show only limited score summary, not detailed question results */}
          <div className="mt-6 relative opacity-50 pointer-events-none select-none filter blur-sm">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <QuizResult result={limitedResultData} onRetake={handleRetake} quizType="code" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-primary/90 text-white px-6 py-3 rounded-lg shadow-lg">
                    Sign in to view detailed results
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
    
    // If we don't have proper results, show sign-in prompt
    console.log("Showing sign-in prompt for unauthenticated user (no Code results available)");
    return (
      <div className="container max-w-md py-10">
        <NonAuthenticatedUserSignInPrompt
          onSignIn={handleSignIn}
          title="Sign In to View Results"
          message="Please sign in to view your detailed quiz results and track your progress over time."
          fallbackAction={{
            label: "Take Quiz Instead",
            onClick: () => router.push(`/dashboard/code/${slug}`),
            variant: "outline",
          }}
        />
      </div>
    );
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
