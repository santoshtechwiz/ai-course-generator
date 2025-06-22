'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch } from '@/store'
import {
  selectQuizResults,
  selectQuizStatus,
  selectQuizId,
  selectIsQuizComplete,
  selectIsProcessingResults,
  clearQuizState,
  restoreQuizAfterAuth,
  checkAuthAndLoadResults,
} from '@/store/slices/quiz-slice'
import { AnimatePresence, motion } from 'framer-motion'
import { Skeleton } from '@/components/ui/skeleton'
import { NoResults } from '@/components/ui/no-results'
import { RefreshCw } from 'lucide-react'
import SignInPrompt from '@/app/auth/signin/components/SignInPrompt'
import { useAuth } from '@/hooks/use-auth'
import type { QuizType } from '@/types/quiz'

interface Props {
  slug: string
  quizType: QuizType
  children: (props: { result: any }) => React.ReactNode
}

type ViewState = 'loading' | 'show_results' | 'show_signin' | 'no_results'

export default function GenericQuizResultHandler({ slug, quizType, children }: Props) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, isLoading: isAuthLoading, login } = useAuth()

  const quizResults = useSelector(selectQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const currentSlug = useSelector(selectQuizId)
  const isCompleted = useSelector(selectIsQuizComplete)
  const isProcessingResults = useSelector(selectIsProcessingResults)

  const hasResults = useMemo(() => {
    return quizResults?.slug === slug
  }, [quizResults, slug])

  const isLoading = useMemo(() => {
    // ✅ Fix: if we already have results, do not stay in loading state
    if (hasResults) return false
    return isAuthLoading || quizStatus === 'loading' || isProcessingResults
  }, [hasResults, isAuthLoading, quizStatus, isProcessingResults])

  // Trigger loading results if needed
  useEffect(() => {
    if (!hasResults && !isLoading && slug) {
      dispatch(checkAuthAndLoadResults({
        slug,
        authStatus: isAuthenticated ? 'authenticated' : 'unauthenticated'
      }))
    }
  }, [hasResults, isLoading, slug, isAuthenticated, dispatch])

  // Restore after login (rehydrate from localStorage or backend)
  useEffect(() => {
    if (isAuthenticated && !hasResults && !isLoading) {
      dispatch(restoreQuizAfterAuth())
    }
  }, [isAuthenticated, hasResults, isLoading, dispatch])

  // ==== View States ====

  const viewState: ViewState = useMemo(() => {
    if (isLoading) return 'loading'
    if (hasResults) return isAuthenticated ? 'show_results' : 'show_signin'
    if (isCompleted) return isAuthenticated ? 'loading' : 'show_signin'
    return 'no_results'
  }, [isLoading, hasResults, isAuthenticated, isCompleted])

  // ==== Actions ====

  const handleRetake = () => {
    dispatch(clearQuizState())
    router.push(`/dashboard/${quizType}/${slug}`)
  }

  const handleSignIn = () => {
    login({
      returnPath: `/dashboard/${quizType}/${slug}/results`,
      quizState: {
        slug,
        results: quizResults,
      }
    })
  }

  // ==== Views ====

  const renderLoading = () => (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-lg mx-auto mt-6 px-4"
    >
      <div className="flex flex-col items-center justify-center mb-4">
        <div className="p-3 bg-muted/30 rounded-full mb-4">
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
        <Skeleton className="h-7 w-48 mx-auto mb-2" />
        <Skeleton className="h-5 w-36 mx-auto" />
      </div>

      <div className="bg-muted/20 p-6 rounded-lg mt-4 mb-4">
        <div className="flex justify-center mb-4">
          <Skeleton className="h-10 w-20 rounded-md" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <div className="flex justify-center mt-4">
          <Skeleton className="h-10 w-40 rounded-md" />
        </div>
      </div>
    </motion.div>
  )

  const renderSignIn = () => (
    <motion.div
      key="signin"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
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
  )

  const renderResults = () => (
    <motion.div
      key="results"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children({ result: quizResults })}
    </motion.div>
  )

  const renderNoResults = () => (
    <motion.div
      key="no-results"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <NoResults
        variant="quiz"
        title="Quiz Results Not Found"
        description="We couldn't find your quiz results. You may not have completed the quiz, or your session expired."
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
  )

  // ==== Final Render ====

  return (
    <AnimatePresence mode="wait">
      {viewState === 'loading' && renderLoading()}
      {viewState === 'show_results' && quizResults && renderResults()}
      {viewState === 'show_signin' && renderSignIn()}
      {viewState === 'no_results' && renderNoResults()}
    </AnimatePresence>
  )
}
