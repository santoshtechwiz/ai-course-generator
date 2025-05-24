"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/store/hooks"
import { Card, CardContent } from "@/components/ui/card"
import {
  selectQuizResults,
  selectQuestions,
  selectAnswers,
  selectQuizTitle,
  selectQuizId,
} from "@/store/slices/quizSlice"
import { LoadingDisplay, ErrorDisplay } from "../../../components/QuizStateDisplay"
import QuizResultsOpenEnded from "../../components/QuizResultsOpenEnded"

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string }
}

export default function OpenEndedQuizResultsPage({ params }: PageProps) {
  const { slug } = use(params)
  const router = useRouter()

  // Redux selectors - get all data from Redux store
  const results = useAppSelector(selectQuizResults)
  const questions = useAppSelector(selectQuestions)
  const answers = useAppSelector(selectAnswers)
  const title = useAppSelector(selectQuizTitle)
  const quizId = useAppSelector(selectQuizId)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("Validating quiz state:", { results, questions, answers })

      // Check for required fields from Redux store
      const hasQuizId = Boolean(quizId)
      const hasQuestions = Boolean(questions && Array.isArray(questions) && questions.length > 0)

      if (!hasQuizId || !hasQuestions) {
        console.error("Invalid quiz state:", { hasQuizId, hasQuestions })
        setError("Quiz data not found or invalid.")
        setTimeout(() => router.replace("/dashboard/quizzes"), 2000)
        return
      }

      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [results, questions, answers, router, quizId])

  if (isLoading) {
    return <LoadingDisplay message="Loading quiz results..." />
  }

  if (error) {
    return (
      <ErrorDisplay error={error} onRetry={() => router.refresh()} onReturn={() => router.push("/dashboard/quizzes")} />
    )
  }

  // Create result object from Redux state
  const quizResult = {
    quizId: quizId || slug,
    slug,
    answers: Object.values(answers),
    questions: questions,
    totalQuestions: questions.length,
    completedAt: new Date().toISOString(),
    title: title || "Open Ended Quiz",
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
