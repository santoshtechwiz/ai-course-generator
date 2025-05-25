"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/store"
import { Card, CardContent } from "@/components/ui/card"
import {
  selectQuizResults,
  selectQuestions,
  selectAnswers,
  selectQuizTitle,
  selectQuizId,
  selectQuizSessionId,
} from "@/store/slices/quizSlice"
import { LoadingDisplay, ErrorDisplay } from "../../../components/QuizStateDisplay"
import QuizResultsOpenEnded from "../../components/QuizResultsOpenEnded"
import { getQuizResults } from "@/store/utils/session"

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
  const sessionId = useAppSelector(selectQuizSessionId)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [localResults, setLocalResults] = useState<any>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("Validating quiz state:", { results, questions, answers, sessionId })

      // Check for required fields from Redux store
      const hasQuizId = Boolean(quizId)
      const hasQuestions = Boolean(questions && Array.isArray(questions) && questions.length > 0)

      // Try to recover results from session storage if not in Redux
      if (!results && sessionId) {
        const sessionResults = getQuizResults(sessionId)
        if (sessionResults) {
          console.log("Recovered results from session storage")
          setLocalResults(sessionResults)
        }
      }

      if (!hasQuizId || !hasQuestions) {
        console.error("Invalid quiz state:", { hasQuizId, hasQuestions })
        setError("Quiz data not found or invalid.")
        setTimeout(() => router.replace("/dashboard/quizzes"), 2000)
        return
      }

      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [results, questions, answers, router, quizId, sessionId])

  if (isLoading) {
    return <LoadingDisplay message="Loading quiz results..." />
  }

  if (error) {
    return (
      <ErrorDisplay error={error} onRetry={() => router.refresh()} onReturn={() => router.push("/dashboard/quizzes")} />
    )
  }

  // Use results from Redux store or from session storage
  const quizResults = results || localResults

  // Create result object from Redux state
  const quizResult = {
    quizId: quizId || slug,
    slug,
    answers: Object.values(answers),
    questions: questions,
    totalQuestions: questions.length,
    completedAt: quizResults?.submittedAt ? new Date(quizResults.submittedAt).toISOString() : new Date().toISOString(),
    title: title || "Open Ended Quiz",
    score: quizResults?.score || 0,
    maxScore: quizResults?.maxScore || questions.length,
    percentage: quizResults?.percentage || 0,
    questionResults: quizResults?.questionResults || [],
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
