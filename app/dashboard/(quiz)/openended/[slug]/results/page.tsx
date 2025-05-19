"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/store"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent } from "@/components/ui/card"
import type { TextQuizState, QuizResult } from "@/types/quiz"
import NonAuthenticatedUserSignInPrompt from "../../../components/NonAuthenticatedUserSignInPrompt"
import { LoadingDisplay, ErrorDisplay } from "../../../components/QuizStateDisplay"
import QuizResultsOpenEnded from "../../components/QuizResultsOpenEnded"

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string }
}

export default function OpenEndedQuizResultsPage({ params }: PageProps) {
  const { slug } = use(params)
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const quizState = useAppSelector((state) => state.textQuiz) as unknown as TextQuizState

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("Validating quiz state:", quizState)

      // Check for required fields
      const hasQuizId = Boolean(quizState?.quizId)
      const hasQuestions = Boolean(quizState?.questions && Array.isArray(quizState.questions) && quizState.questions.length > 0)

      if (!hasQuizId || !hasQuestions) {
        console.error("Invalid quiz state:", { hasQuizId, hasQuestions, quizState })
        setError("Quiz data not found or invalid.")
        setTimeout(() => router.replace("/dashboard/quizzes"), 2000)
        return
      }

      // Validate slug if available
      if (quizState.slug && quizState.slug !== slug) {
        console.error("Quiz slug mismatch:", { stateSlug: quizState.slug, pageSlug: slug })
        setError("Quiz slug does not match.")
        setTimeout(() => router.replace("/dashboard/quizzes"), 2000)
        return
      }

      setIsLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [quizState, slug, router])

  if (isLoading) {
    return <LoadingDisplay message="Loading quiz results..." />
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => router.refresh()}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  if (!isAuthenticated) {
    return (
      <NonAuthenticatedUserSignInPrompt
        quizType="openended"
        message="Sign in to save your results and track your progress"
        previewData={{
          score: quizState.answers.length,
          maxScore: quizState.questions?.length || 0,
          percentage: Math.round((quizState.answers.length / Math.max(1, quizState.questions?.length || 0)) * 100),
        }}
        returnPath={`/dashboard/openended/${slug}/results`}
      />
    )
  }

  const quizResult: QuizResult = {
    quizId: quizState.quizId!,
    slug,
    answers: quizState.answers || [], // Ensure answers is never undefined
    questions: quizState.questions || [], // Use questions from state
    totalQuestions: quizState.questions?.length || 0,
    completedAt: quizState.completedAt || new Date().toISOString(),
    title: quizState.title || quizState.quizData?.title || "Open Ended Quiz",
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
