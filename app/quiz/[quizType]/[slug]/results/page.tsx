'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { QuizResultsSummary } from '@/components/quiz/QuizResultsSummary'
import { Loader } from '@/components/loader'
import { withErrorBoundary } from '@/components/error-boundary'
import { ErrorMessage } from '@/components/shared/ErrorMessage'
import { useQueryWithProgress } from '@/hooks/use-query-with-progress'

function QuizResultsPage() {
  const params = useParams()
  const { data: results, isLoading, error } = useQueryWithProgress(
    `/api/quizzes/${params.quizType}/${params.slug}/results`
  )

  if (isLoading) {
    return <Loader message="Loading quiz results..." />
  }

  if (error) {
    return <ErrorMessage message="Failed to load quiz results" error={error} />
  }

  if (!results) {
    return <ErrorMessage message="No quiz results found" />
  }

  return (
    <div className="container mx-auto py-8">
      <QuizResultsSummary
        questions={results.questions.map((q: any) => ({
          id: q.id,
          question: q.question,
          userAnswer: q.userAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect: q.isCorrect,
          timeSpent: q.timeSpent,
        }))}
      />
    </div>
  )
}

export default withErrorBoundary(QuizResultsPage)
