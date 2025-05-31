"use client"

import { use, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { signIn, useSession } from "next-auth/react"
import type { AppDispatch } from "@/store"
import { Card, CardContent } from "@/components/ui/card"
import {
  selectQuizResults,
  selectQuizStatus,
  selectQuizError,
  selectQuestions,
  selectAnswers,
  selectQuizTitle,
  selectOrGenerateQuizResults,
  setPendingQuiz,
} from "@/store/slices/quizSlice"
import { selectIsAuthenticated } from "@/store/slices/authSlice"
import { QuizLoadingSteps } from "../../../components/QuizLoadingSteps"
import { NonAuthenticatedUserSignInPrompt } from "../../../components/NonAuthenticatedUserSignInPrompt"
import QuizResult from "../../../components/QuizResult"
import { useSessionService } from "@/hooks/useSessionService"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ResultsPageProps {
  params: { slug: string }
}

export default function CodeResultsPage({ params }: ResultsPageProps) {
  const resolvedParams = params instanceof Promise ? use(params) : params
  const slug = resolvedParams.slug

  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { saveAuthRedirectState, restoreAuthRedirectState } = useSessionService()
  const { status: authStatus, data: sessionData } = useSession()

  // Redux state
  const quizResults = useSelector(selectQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const error = useSelector(selectQuizError)
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const title = useSelector(selectQuizTitle)
  const generatedResults = useSelector(selectOrGenerateQuizResults)

  // Validate slug and redirect if invalid
  useEffect(() => {
    if (!slug || typeof slug !== "string") {
      console.error("Invalid slug provided to results page")
      router.push("/dashboard/quizzes")
      return
    }
  }, [slug, router])

  // Check for auth return after sign-in
  useEffect(() => {
    if (authStatus === "authenticated" && sessionData) {
      // Restore any saved quiz state from auth redirect
      restoreAuthRedirectState()
    }
  }, [authStatus, sessionData, restoreAuthRedirectState])

  // Redirect to quiz if no results or answers available
  useEffect(() => {
    if ((!generatedResults || Object.keys(generatedResults).length === 0) && 
        !quizResults && 
        (!answers || Object.keys(answers).length === 0)) {
      router.push(`/dashboard/code/${slug}`)
    }
  }, [generatedResults, quizResults, answers, router, slug])

  const handleRetake = useCallback(() => {
    router.push(`/dashboard/code/${slug}?reset=true`)
  }, [router, slug])

  const handleSignIn = useCallback(async () => {
    try {
      // Create partial results to preserve score but hide details
      const partialResults = generatedResults || {
        slug,
        title: title || `Code Quiz - ${slug}`,
        percentage: Math.floor(Math.random() * 30) + 40, // Random score between 40-70%
        score: 0,
        maxScore: questions.length,
      }
      
      // Store comprehensive quiz state for when user returns after authentication
      saveAuthRedirectState({
        returnPath: `/dashboard/code/${slug}/results`,
        quizState: {
          slug,
          quizData: {
            title: title,
            questions: questions,
          },
          currentState: {
            answers,
            showResults: true,
            results: generatedResults || quizResults,
          },
        },
      })
      
      await signIn(undefined, { callbackUrl: `/dashboard/code/${slug}/results` })
    } catch (error) {
      console.error("Sign in failed:", error)
    }
  }, [saveAuthRedirectState, slug, title, questions, answers, generatedResults, quizResults])

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

  // Redirect to quiz if no answers are available
  if (Object.keys(answers).length === 0) {
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

  // Show results from Redux state
  const resultData = useMemo(() => {
    // Start with existing quiz results or generated results
    const baseData = quizResults || generatedResults;
    
    // If we have no base data but have answers, create a minimal result object
    if (!baseData && Object.keys(answers).length > 0) {
      return {
        slug,
        title: title || `Code Quiz - ${slug}`,
        questions,
        // Generate question results from answers
        questionResults: Object.entries(answers).map(([questionId, answerData]) => ({
          questionId,
          selectedOptionId: answerData.selectedOptionId,
          userAnswer: answerData.selectedOptionId,
          isCorrect: !!answerData.isCorrect
        }))
      };
    }
    
    return baseData;
  }, [quizResults, generatedResults, answers, slug, title, questions]);

  // For unauthenticated users, show the sign-in prompt with limited results
  if (!isAuthenticated) {
    // If we have results, show a teaser of results with limited information
    if (resultData && Object.keys(resultData).length > 0) {
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
                  <li className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Get personalized recommendations for improvement</span>
                  </li>
                </ul>
              </div>
              
              {/* Show only limited score summary, not detailed question results */}
              <div className="opacity-50 pointer-events-none select-none filter blur-sm">
                <QuizResult result={limitedResultData} onRetake={handleRetake} quizType="code" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-primary/90 text-white px-6 py-3 rounded-lg shadow-lg">
                    Sign in to view detailed results
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
    
    // If we don't have proper results, show sign-in prompt
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
    )
  }
  
  // For authenticated users, show full results
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
