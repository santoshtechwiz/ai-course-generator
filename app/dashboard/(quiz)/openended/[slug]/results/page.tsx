"use client"

import { use } from "react"
import { useRouter } from "next/navigation"
import { useSelector } from "react-redux"
import { Card, CardContent } from "@/components/ui/card"
import { ErrorDisplay } from "../../../components/QuizStateDisplay"
import { selectQuizResults, selectQuestions, selectAnswers, selectQuizTitle } from "@/store/slices/quizSlice"
import QuizResultsOpenEnded from "../../components/QuizResultsOpenEnded"

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string }
}

export default function OpenEndedQuizResultsPage({ params }: PageProps) {
  const slug = params instanceof Promise ? use(params).slug : params.slug
  const router = useRouter()

  // Redux selectors
  const results = useSelector(selectQuizResults)
  const questions = useSelector(selectQuestions)
  const answers = useSelector(selectAnswers)
  const title = useSelector(selectQuizTitle)

  // No quiz data found
  if (!questions || questions.length === 0) {
    return (
      <ErrorDisplay 
        error="Quiz data not found" 
        onReturn={() => router.push("/dashboard/quizzes")} 
      />
    )
  }

  // No results found
  if (!results) {
    return (
      <div className="container mx-auto max-w-5xl py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">No Results Found</h1>
        <p>We couldn't find your results for this quiz.</p>
        <div className="mt-6">
          <button
            onClick={() => router.push(`/dashboard/openended/${slug}`)}
            className="bg-primary hover:bg-primary/90 text-white font-medium py-2 px-4 rounded"
          >
            Take the Quiz
          </button>
        </div>
      </div>
    )
  }

  // Create result object from Redux state
  const quizResult = {
    quizId: slug,
    slug,
    answers: Object.values(answers),
    questions: questions,
    totalQuestions: questions.length,
    completedAt: results?.submittedAt ? new Date(results.submittedAt).toISOString() : new Date().toISOString(),
    title: title || "Open Ended Quiz",
    score: results?.score || 0,
    maxScore: results?.maxScore || questions.length,
    percentage: results?.percentage || 0,
    questionResults: results?.questionResults || [],
  }

  return (
    <div className="container mx-auto max-w-5xl py-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <QuizResultsOpenEnded result={quizResult} />
        </CardContent>
      </Card>
    </div>
  )
}
