'use client'
import { use, useEffect, useState } from "react"
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
  selectQuizError,
  fetchQuizResults
} from "@/store/slices/quizSlice"
import McqQuizResult from "../../components/McqQuizResult"
import { QuizLoadingSteps } from "../../../components/QuizLoadingSteps"
import { NonAuthenticatedUserSignInPrompt } from "../../../components/NonAuthenticatedUserSignInPrompt"
import { QuizResult, McqQuestion } from "@/app/types/quiz-types"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  const error = useSelector(selectQuizError)
  const [isLoading, setIsLoading] = useState(true)
  const [localError, setLocalError] = useState<string | null>(null)

  // Generate results from questions and answers if needed
  const [generatedResults, setGeneratedResults] = useState<QuizResult | null>(null);
  
  // Generate results from available questions and answers if they exist
  useEffect(() => {
    if (!quizResults && questions.length > 0 && Object.keys(answers).length > 0) {
      try {
        // Count correct answers
        let score = 0;
        let answeredQuestions = 0;
        
        const questionResults = questions.map(question => {
          const answer = answers[question.id];
          let isCorrect = false;
          
          if (answer) {
            answeredQuestions++;
            
            // Determine if answer is correct based on the answer type
            if ('isCorrect' in answer) {
              isCorrect = answer.isCorrect === true;
            } else if ('selectedOptionId' in answer) {
              const correctOptionId = question.correctOptionId || question.answer;
              isCorrect = answer.selectedOptionId === correctOptionId;
            }
            
            if (isCorrect) score++;
          }
          
          return {
            questionId: question.id,
            isCorrect,
            userAnswer: answer?.selectedOptionId || null,
            correctAnswer: question.correctOptionId || question.answer
          };
        });
        
        setGeneratedResults({
          quizId: questions[0]?.id || "unknown",
          title: quizTitle || "Quiz Results",
          slug: slug,
          score,
          maxScore: questions.length,
          percentage: Math.round((score / questions.length) * 100),
          completedAt: new Date().toISOString(),
          questions: questions as any,
          answers: Object.values(answers) as any
        });
      } catch (err) {
        console.error("Failed to generate results:", err);
      }
    }
  }, [quizResults, questions, answers, quizTitle, slug]);

  // Load results if not already in store
  useEffect(() => {
    async function loadResults() {
      try {
        setIsLoading(true)
        if (!quizResults) {
          // Try to fetch results if we don't have them
          await dispatch(fetchQuizResults(slug)).unwrap()
        }
      } catch (err) {
        console.error("Failed to load quiz results:", err)
        setLocalError(
          err instanceof Error ? err.message : "Failed to load quiz results"
        )
      } finally {
        setIsLoading(false)
      }
    }

    if (isAuthenticated && quizStatus !== 'loading' && quizStatus !== 'submitting' && quizStatus !== 'error') {
      loadResults()
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

  if (localError || error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Results</h2>
        <p className="text-muted-foreground mb-6">
          {localError || error || "We couldn't load your quiz results."}
        </p>
        <div className="space-x-4">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/dashboard/mcq/${slug}`)}
          >
            Retry Quiz
          </Button>
          <Button onClick={() => router.push("/dashboard/quizzes")}>
            Back to Quizzes
          </Button>
        </div>
      </div>
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
  const resultsWithSlug = {
    ...resultsToShow,
    slug: slug
  }

  return resultsToShow ? (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <McqQuizResult result={resultsWithSlug as QuizResult} />
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