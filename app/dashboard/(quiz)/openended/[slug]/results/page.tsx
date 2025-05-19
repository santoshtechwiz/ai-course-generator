'use client'
import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/store'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingDisplay, ErrorDisplay } from '../../../components/QuizStateDisplay'
import NonAuthenticatedUserSignInPrompt from '../../../components/NonAuthenticatedUserSignInPrompt'
import QuizResultsOpenEnded from '../../components/QuizResultsOpenEnded'
import type { TextQuizState, QuizResult } from '@/types/quiz'

interface PageProps {
  params: { slug: string }
}

export default function OpenEndedQuizResultsPage({ params }: PageProps) {
  const router = useRouter()
  const { slug } = use(params)
  const { isAuthenticated } = useAuth()
  const quizState = useAppSelector((state) => state.textQuiz) as unknown as TextQuizState
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Validate quiz state with a delay to let state rehydrate
    const timer = setTimeout(() => {
      try {
        const hasValidData = Boolean(
          quizState?.quizId &&
          Array.isArray(quizState?.answers) &&
          quizState.answers.length > 0 &&
          Array.isArray(quizState?.questions) &&
          quizState.questions.length > 0
        )

        if (!hasValidData ) {
          console.error("Invalid quiz state:", quizState)
          setError("Quiz data not found or invalid")
          // Wait before redirecting
          setTimeout(() => router.replace('/dashboard/quizzes'), 2000)
        }
        
        setIsLoading(false)
      } catch (err) {
        console.error("Error validating quiz state:", err)
        setError("An error occurred while loading quiz results")
        setIsLoading(false)
      }
    }, 1500) // Allow time for state to rehydrate

    return () => clearTimeout(timer)
  }, [quizState, router])

  // While loading auth or quiz data
  if ( isLoading) {
    return <LoadingDisplay message="Loading quiz results..." />
  }
  
  // If there's an error
  if (error) {
    return (
      <ErrorDisplay
        error={error}
        onRetry={() => router.refresh()}
        onReturn={() => router.push("/dashboard/quizzes")}
      />
    )
  }

  // For guest users: show preview but prompt to sign in
  if (!isAuthenticated) {
    return (
      <NonAuthenticatedUserSignInPrompt
        quizType="openended"
        message="Sign in to save your results and track your progress"
        previewData={{
          score: quizState.answers.length,
          maxScore: quizState.questions.length,
          percentage: Math.round((quizState.answers.length / Math.max(1, quizState.questions.length)) * 100)
        }}
      />
    )
  }

  // Safe to render results now
  const quizResult: QuizResult = {
    quizId: quizState.quizId!,
    slug,
    answers: quizState.answers,
    questions: quizState.questions,
    totalQuestions: quizState.questions.length,
    completedAt: quizState.completedAt || new Date().toISOString(),
  }

  return (
    <Card>
      <CardContent className="p-6">
        <QuizResultsOpenEnded result={quizResult} />
      </CardContent>
    </Card>
  )
}
