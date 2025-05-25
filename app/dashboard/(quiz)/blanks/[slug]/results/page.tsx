"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { selectQuizResults, selectQuestions, selectAnswers, 
  selectQuizTitle } from "@/store/slices/quizSlice"
import { selectIsAuthenticated } from "@/store/slices/authSlice"
import { NonAuthenticatedUserSignInPrompt } 
from "../../../components/NonAuthenticatedUserSignInPrompt"
import { BlankQuizResults } from "../../components/BlankQuizResults"


interface ResultsPageProps {
  params: Promise<{ slug: string }> | { slug: string }
}

export default function BlanksResultsPage({ params }: ResultsPageProps) {
  // Extract slug in a way that works in tests and in real usage
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
    router.push(`/api/auth/signin?callbackUrl=/dashboard/blanks/${slug}/results`);
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

  // No results found
  if (!results && !questions.length) {
    return (
      <div className="container max-w-4xl py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">No Results Found</h1>
        <p>We couldn't find your results for this quiz.</p>
        <div className="mt-6">
          <Button
            onClick={() => router.push(`/dashboard/blanks/${slug}`)}
            className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded"
          >
            Take the Quiz
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

  // Create quiz result object from Redux state
  const quizResult = {
    quizId: slug,
    slug,
    title: title || 'Fill in the Blanks Quiz',
    score: results?.score || 0,
    maxScore: questions.length,
    totalQuestions: questions.length,
    correctAnswers: results?.score || 0,
    percentage: results?.percentage || 0,
    completedAt: results?.submittedAt ? new Date(results.submittedAt).toISOString() : new Date().toISOString(),
    questionResults: results?.questionResults || []
  }

  return (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <BlankQuizResults 
            result={quizResult} 
            onRetake={() => router.push(`/dashboard/blanks/${slug}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
