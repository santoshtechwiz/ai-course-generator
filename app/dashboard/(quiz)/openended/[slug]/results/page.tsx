"use client"

import { Suspense, use } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { Button } from "@/components/ui/button"
import { selectIsAuthenticated } from "@/store/slices/authSlice"
import { Spinner } from "@/hooks/spinner"
import { selectQuizResults, selectQuestions, selectAnswers, selectQuizTitle } from "@/store/slices/quizSlice"
import { NonAuthenticatedUserSignInPrompt } 
from "../../../components/NonAuthenticatedUserSignInPrompt"
import QuizResultsOpenEnded from "../../components/QuizResultsOpenEnded"
import { QuizSubmissionLoading } from "../../../components"


interface PageProps {
  params: Promise<{ slug: string }> | { slug: string }
}

export default function OpenEndedQuizResultsPage({ params }: PageProps) {
  const slug = params instanceof Promise ? use(params).slug : params.slug
  const router = useRouter()
  
  // Authentication state
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Redux selectors
  const results = useSelector(selectQuizResults)
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const title = useSelector(selectQuizTitle)

  // Handle sign in
  const handleSignIn = () => {
    // In a real app, this would redirect to your auth provider
    router.push(`/api/auth/signin?callbackUrl=/dashboard/openended/${slug}/results`);
  };

  // If not authenticated, show sign in prompt
  if (!isAuthenticated) {
    return (
      <div className="container max-w-md py-10">
        <NonAuthenticatedUserSignInPrompt 
          onSignIn={handleSignIn}
          title="Sign In to View Results"
          message="Please sign in to view your quiz results and track your progress."
        />
      </div>
    )
  }

  // No quiz data found
  if (!questions || questions.length === 0) {
    return (
      <div className="container max-w-4xl py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Quiz Not Found</h1>
        <p>We couldn't find this quiz or your responses.</p>
        <div className="mt-6">
          <Button
            onClick={() => router.push("/dashboard/quizzes")}
            className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded"
          >
            Browse Quizzes
          </Button>
        </div>
      </div>
    )
  }

  // Loading state
  if (!results) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-muted-foreground">Loading your results...</p>
        </div>
      </div>
    );
  }

  // Create result object from Redux state
  const quizResult = {
    quizId: slug,
    slug,
    title: title || "Open Ended Quiz",
    score: results?.score || 0,
    maxScore: results?.maxScore || questions.length,
    totalQuestions: questions.length,
    correctAnswers: results?.score || 0,
    percentage: results?.percentage || 0,
    completedAt: results?.submittedAt ? new Date(results.submittedAt).toISOString() : new Date().toISOString(),
    questionResults: results?.questionResults || [],
  }

  return (
    <div className="container py-8">
      <Suspense fallback={<QuizSubmissionLoading quizType="openended" />}>
        <QuizResultsOpenEnded 
          result={quizResult} 
          onRetake={() => router.push(`/dashboard/openended/${slug}`)}
          slug={slug}
        />
      </Suspense>
    </div>
  )
}

