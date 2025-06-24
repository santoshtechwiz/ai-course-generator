'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { NoResults } from '@/components/ui/no-results'
import SignInPrompt from '@/app/auth/signin/components/SignInPrompt'

import { useAuth } from '@/hooks/use-auth'
import {
  selectQuizResults,
  selectQuizStatus,
  selectQuizQuestions,
  clearQuizState,
  checkAuthAndLoadResults,
} from '@/store/slices/quiz-slice'

import type { AppDispatch } from '@/store'
import type { QuizType } from '@/types/quiz'

interface Props {
  slug: string
  quizType: QuizType
  children: (props: { result: any }) => React.ReactNode
}

export default function GenericQuizResultHandler({ slug, quizType, children }: Props) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading, login } = useAuth()

  const quizResults = useSelector(selectQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const quizQuestions = useSelector(selectQuizQuestions)

  const [error, setError] = useState<string | null>(null)

  // Effect: Load results once auth is resolved
  useEffect(() => {
    if (isAuthLoading || !slug) return

    dispatch(
      checkAuthAndLoadResults()
    )
      .unwrap()
      .catch((err: any) => {
        const message = err instanceof Error ? err.message : 'Failed to load results'
        setError(message)
      })
  }, [slug, isAuthLoading, isAuthenticated, dispatch])

  // Transform quiz results to match expected format for McqQuizResult component
  const processedResults = useMemo(() => {
    if (!quizResults) return null    // Map the results to include questionResults format that McqQuizResult component expects
    return {
      ...quizResults,
      title: slug || 'Quiz Results',
      questions: quizQuestions || [], // Include the full questions data
      
      // Ensure metadata fields are properly formatted for display
      score: quizResults.score || 0,
      maxScore: quizResults.maxScore || 0,
      percentage: quizResults.percentage || 0,
      submittedAt: quizResults.submittedAt || new Date().toISOString(),
      completedAt: quizResults.completedAt || new Date().toISOString(),
      questionResults: quizResults.results?.map((result) => {
        // Find the corresponding answer detail
        const answerDetail = quizResults.answers?.find(
          (answer) => answer.questionId === result.questionId
        )
        
        // Find the corresponding question
        const questionData = quizQuestions?.find(
          (q) => String(q.id) === result.questionId
        )

        return {
          questionId: result.questionId,
          // Use actual question text instead of just the ID
          question: questionData?.question || result.questionId,
          // Explicitly show "(No answer selected)" for null or undefined answers
          userAnswer: result.userAnswer === null || result.userAnswer === undefined 
            ? '(No answer selected)' 
            : result.userAnswer || '',
          correctAnswer: result.correctAnswer || '',
          isCorrect: result.isCorrect,
          type: answerDetail?.type || 'mcq',
          selectedOptionId: answerDetail?.selectedOptionId || '',
          options: questionData?.options || [], // Include options from the question data
        }
      }) || [],
    }
  }, [quizResults, quizQuestions, slug])

  // Derived states
  const isLoading = quizStatus === 'loading' || isAuthLoading
  const hasResults = useMemo(() => {
    return quizResults?.slug === slug && typeof quizResults?.percentage === 'number'
  }, [quizResults, slug])

  const viewState = useMemo(() => {
    if (isLoading) return 'loading'
    if (hasResults && !isAuthenticated) return 'show_signin'
    if (hasResults) return 'show_results'
    if (error) return 'error'
    return 'no_results'
  }, [isLoading, hasResults, isAuthenticated, error])

  const handleRetake = () => {
    dispatch(clearQuizState())
    router.push(`/dashboard/${quizType}/${slug}`)
  }

  const handleRetry = () => {
    setError(null)
    router.refresh()
  }

  const handleSignIn = () => {
    login('credentials', {
      callbackUrl: `/dashboard/${quizType}/${slug}/results`,
    })
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {viewState === 'loading' && (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6 max-w-lg mx-auto mt-6 px-4"
        >
          <div className="flex flex-col items-center justify-center">
            <div className="p-3 bg-muted/30 rounded-full mb-4">
              <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
            <div className="text-sm font-medium">Loading your quiz results...</div>
          </div>
          <Skeleton className="h-24 w-full rounded-lg" />
        </motion.div>
      )}

      {viewState === 'show_results' && (
        <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {children({ result: processedResults })}
        </motion.div>
      )}

      {viewState === 'show_signin' && (
        <motion.div key="signin" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <SignInPrompt
            onSignIn={handleSignIn}
            onRetake={handleRetake}
            quizType={quizType}
            previewData={
              quizResults
                ? {
                    percentage: quizResults.percentage || 0,
                    score: quizResults.score || 0,
                    maxScore: quizResults.maxScore || 0,
                  }
                : undefined
            }
          />
        </motion.div>
      )}

      {viewState === 'error' && (
        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <NoResults
            variant="quiz"
            title="Error Loading Quiz"
            description={`${error}. Please try again.`}
            action={{
              label: 'Retry',
              onClick: handleRetry,
              icon: <RefreshCw className="h-4 w-4" />,
              variant: 'default',
            }}
            secondaryAction={{
              label: 'Back to Dashboard',
              onClick: () => router.push('/dashboard'),
              variant: 'outline',
            }}
          />
        </motion.div>
      )}

      {viewState === 'no_results' && (
        <motion.div key="no-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <NoResults
            variant="quiz"
            title="No Results Found"
            description="We couldn't find any quiz results. Try retaking the quiz."
            action={{
              label: 'Retake Quiz',
              onClick: handleRetake,
              icon: <RefreshCw className="h-4 w-4" />,
              variant: 'default',
            }}
            secondaryAction={{
              label: 'Back to Dashboard',
              onClick: () => router.push('/dashboard'),
              variant: 'outline',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
