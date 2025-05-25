"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { Card, CardContent } from "@/components/ui/card"

import CodeQuizResult from "../../components/CodeQuizResult"
import { 
  selectQuizResults, 
  selectQuestions, 
  selectAnswers, 
  selectQuizTitle,
  selectQuizId
} from "@/store/slices/quizSlice"
import { CodeQuizQuestion, QuizResult, QuizQuestionResult } from "@/app/types/quiz-types"
import { QuizLoadingSteps } from "../../../components/QuizLoadingSteps"

interface ResultsPageProps {
  params: Promise<{ slug: string }> | { slug: string }
}

function ErrorDisplay({
  error,
  onRetry,
  onReturn,
}: {
  error: string
  onRetry: () => void
  onReturn: () => void
}) {
  return (
    <div className="container max-w-4xl py-10 text-center">
      <h1 className="text-2xl font-bold mb-4 text-red-600">Error Loading Results</h1>
      <p className="mb-6">{error}</p>
      <div className="flex gap-4 justify-center">
        <button onClick={onRetry} className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded">
          Try Again
        </button>
        <button onClick={onReturn} className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded">
          Return to Dashboard
        </button>
      </div>
    </div>
  )
}

export default function CodeResultsPage({ params }: ResultsPageProps) {
  // Extract slug in a way that works in tests and in real usage
  const slug =
    params instanceof Promise
      ? use(params).slug // Real usage with Next.js
      : (params as { slug: string }).slug // Test usage

  const router = useRouter()
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Redux selectors with proper types
  const results = useSelector(selectQuizResults)
  const questions = useSelector(selectQuestions) as CodeQuizQuestion[]
  const answers = useSelector(selectAnswers) as Record<string | number, any>
  const title = useSelector(selectQuizTitle)
  const quizId = useSelector(selectQuizId)

  // Simulate loading to avoid flash
  useState(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  })

  // Loading state
  if (isLoading) {
    return (
      <QuizLoadingSteps
        steps={[
          { label: "Loading quiz results", status: "loading" },
        ]}
      />
    )
  }

  // Error state
  if (loadError) {
    return (
      <ErrorDisplay
        error={loadError}
        onRetry={() => setLoadError(null)}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  // No results found
  if (!results && (!questions || questions.length === 0)) {
    return (
      <div className="container max-w-4xl py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">No Results Found</h1>
        <p>We couldn't find your results for this quiz.</p>
        <div className="mt-6">
          <button
            onClick={() => router.push(`/dashboard/code/${slug}`)}
            className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded"
          >
            Take the Quiz
          </button>
        </div>
      </div>
    )
  }

  // Build quiz result from Redux state
  const quizResult: QuizResult & { questions: QuizQuestionResult[] } = {
    quizId: quizId || slug,
    slug,
    title: title || "Code Quiz",
    score: results?.score ?? 0,
    maxScore: results?.maxScore ?? questions.length,
    percentage: results?.percentage ?? 
      (questions.length > 0 ? Math.round((Object.values(answers).filter(a => a.isCorrect).length / questions.length) * 100) : 0),
    completedAt: results?.submittedAt ?? new Date().toISOString(),
    questions: results?.questionResults?.map((qr: any) => {
        // Map from API results format
        const question = questions.find((q) => q.id === qr.questionId)
        return {
          id: qr.questionId,
          question: question?.question || question?.text || "",
          userAnswer: qr.userAnswer || qr.answer || "",
          correctAnswer: qr.correctAnswer || question?.answer || question?.correctAnswer || "",
          isCorrect: qr.isCorrect ?? false,
        }
      }) || 
      // Build from current Redux state
      questions.map((q) => {
        const answer = answers[q.id]
        return {
          id: q.id,
          question: q.question || q.text || "",
          userAnswer: answer?.answer || "",
          correctAnswer: q.answer || q.correctAnswer || "",
          isCorrect: answer?.isCorrect ?? false,
        }
      }),
  }

  // Handle quiz retake
  const handleRetake = () => {
    router.push(`/dashboard/code/${slug}?reset=true`)
  }

  return (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <CodeQuizResult result={quizResult} onRetake={handleRetake} />
        </CardContent>
      </Card>
    </div>
  )
}
