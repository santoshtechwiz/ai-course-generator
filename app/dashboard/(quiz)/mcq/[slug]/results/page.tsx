'use client'
import { use, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
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
  
  // Get results and state from Redux store
  const quizResults = useSelector(selectQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const quizTitle = useSelector(selectQuizTitle)
  const questions = useSelector(selectQuestions) as McqQuestion[]
  const answers = useSelector(selectAnswers)

  // Load results if not already in store
  useEffect(() => {
    if (!quizResults && quizStatus !== 'loading' && quizStatus !== 'submitting' && quizStatus !== 'error') {
      // Try to fetch results if we don't have them
      dispatch(fetchQuizResults(slug))
    }
  }, [quizResults, quizStatus, slug, dispatch])

  // Generate results from Redux state if no server results
  const generatedResults = !quizResults && questions.length > 0 ? {
    quizId: slug,
    slug,
    title: quizTitle || "Multiple Choice Quiz",
    questions: questions,
    answers: Object.values(answers || {}),
    score: Object.values(answers || {}).filter(a => a.isCorrect).length,
    maxScore: questions.length,
    percentage: Math.round(
      (Object.values(answers || {}).filter(a => a.isCorrect).length / questions.length) * 100
    ),
    completedAt: new Date().toISOString()
  } : null

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