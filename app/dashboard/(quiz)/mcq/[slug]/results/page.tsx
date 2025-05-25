'use client'
import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import { useSession } from "next-auth/react"
import { AppDispatch } from "@/store"
import { Card, CardContent } from "@/components/ui/card"
import { 
  selectQuizResults, 
  selectQuizId,
  selectQuizStatus,
  selectQuizTitle,
  selectQuestions,
  selectAnswers,
  fetchQuizResults
} from "@/store/slices/quizSlice"
import McqQuizResult from "../../components/McqQuizResult"
import { QuizLoadingSteps } from "../../../components/QuizLoadingSteps"
import { NonAuthenticatedUserSignInPrompt } from "../../../components/NonAuthenticatedUserSignInPrompt"
import { QuizResult, McqQuestion } from "@/app/types/quiz-types"

interface ResultsPageProps {
  params: Promise<{ slug: string }> | { slug: string }
}

export default function McqResultsPage({ params }: ResultsPageProps) {
  // Extract slug in a way that works in tests and in real usage
  const slug =
    params instanceof Promise
      ? use(params).slug // Real usage with Next.js
      : (params as { slug: string }).slug // Test usage

  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  
  // Get authentication status
  const { data: session, status: authStatus } = useSession()
  const isAuthenticated = authStatus === "authenticated"
  
  // Get results and state from Redux store
  const quizResults = useSelector(selectQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const quizTitle = useSelector(selectQuizTitle)
  const questions = useSelector(selectQuestions) as McqQuestion[]
  const answers = useSelector(selectAnswers)

  // Load results if not already in store
  useEffect(() => {
    if (isAuthenticated && !quizResults && quizStatus !== 'loading' && quizStatus !== 'submitting' && quizStatus !== 'error') {
      // Try to fetch results if we don't have them
      dispatch(fetchQuizResults(slug))
    }
  }, [isAuthenticated, quizResults, quizStatus, slug, dispatch])

  // Handle sign in
  const handleSignIn = () => {
    router.push(`/api/auth/signin?callbackUrl=/dashboard/mcq/${slug}/results`)
  }

  // Authentication loading
  if (authStatus === "loading") {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Checking authentication...", status: "loading" }
        ]}
      />
    )
  }

  // Not authenticated - show sign in prompt
  if (!isAuthenticated) {
    return (
      <NonAuthenticatedUserSignInPrompt
        onSignIn={handleSignIn}
        title="Sign In to View Results"
        message="Please sign in to view your quiz results and track your progress."
      />
    )
  }

  // Loading state
  if (quizStatus === 'loading') {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Loading your results...", status: "loading" }
        ]}
      />
    )
  }

  // No results found and no questions to generate from
  if (!quizResults && !generatedResults && quizStatus !== 'submitting' && quizStatus !== 'idle') {
    return (
      <div className="container max-w-4xl py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">No Results Found</h1>
        <p>We couldn't find your results for this quiz.</p>
        <div className="mt-6">
          <button
            onClick={() => router.push(`/dashboard/mcq/${slug}`)}
            className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded"
          >
            Take the Quiz
          </button>
        </div>
      </div>
    )
  }

  // Display results if we have them
  const resultsToShow = quizResults || generatedResults
  return resultsToShow ? (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <McqQuizResult result={resultsToShow as QuizResult} />
        </CardContent>
      </Card>
    </div>
  ) : (
    <QuizLoadingSteps
      steps={[
        { label: "Preparing your quiz results...", status: "loading" }
      ]}
    />
  )
}