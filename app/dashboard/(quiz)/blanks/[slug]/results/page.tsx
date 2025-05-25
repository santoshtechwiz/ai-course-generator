"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/store"
import { Card, CardContent } from "@/components/ui/card"
import { ErrorDisplay } from "../../../components/QuizStateDisplay"
import { selectQuizResults, selectQuestions, selectAnswers, selectQuizTitle } from "@/store/slices/quizSlice"
import type { QuizResult } from "@/app/types/quiz-types"
import { BlankQuizResults } from "../../components/BlankQuizResults"

interface ResultsPageProps {
  params: Promise<{ slug: string }> | { slug: string }
}

export default function BlanksResultsPage({ params }: ResultsPageProps) {
  // Extract slug in a way that works in tests and in real usage
  const slug =
    params instanceof Promise
      ? use(params).slug // Real usage with Next.js
      : (params as { slug: string }).slug // Test usage

  const router = useRouter()
  const [loadError, setLoadError] = useState<string | null>(null)

  // Redux selectors
  const results = useAppSelector(selectQuizResults)
  const questions = useAppSelector(selectQuestions)
  const answers = useAppSelector(selectAnswers)
  const title = useAppSelector(selectQuizTitle)

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
  if (!results && !questions.length) {
    return (
      <div className="container max-w-4xl py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">No Results Found</h1>
        <p>We couldn't find your results for this quiz.</p>
        <div className="mt-6">
          <button
            onClick={() => router.push(`/dashboard/blanks/${slug}`)}
            className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded"
          >
            Take the Quiz
          </button>
        </div>
      </div>
    )
  }


  return (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <BlankQuizResults result={quizResult} />
        </CardContent>
      </Card>
    </div>
  )
}
