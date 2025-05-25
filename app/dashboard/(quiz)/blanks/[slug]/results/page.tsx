"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { Card, CardContent } from "@/components/ui/card"

import { selectQuizResults, selectQuestions, selectAnswers, selectQuizTitle } from "@/store/slices/quizSlice"
import { BlankQuizResults } from "../../components/BlankQuizResults"

interface ResultsPageProps {
  params: Promise<{ slug: string }> | { slug: string }
}

export default function BlanksResultsPage({ params }: ResultsPageProps) {
  // Extract slug in a way that works in tests and in real usage
  const slug = params instanceof Promise ? use(params).slug : params.slug

  const router = useRouter()

  // Redux selectors
  const results = useSelector(selectQuizResults)
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const title = useSelector(selectQuizTitle)

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

  // Create quiz result object from Redux state
  const quizResult = {
    score: results?.score || 0,
    maxScore: questions.length,
    totalQuestions: questions.length,
    correctAnswers: results?.score || 0,
    completedAt: results?.submittedAt ? new Date(results.submittedAt).toISOString() : new Date().toISOString(),
    title: title || 'Fill in the Blanks Quiz',
    slug,
    quizId: slug
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
