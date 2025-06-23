'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch } from '@/store'
import {
  selectQuizResults,
  selectQuizStatus,
  selectIsQuizComplete,
  selectIsProcessingResults,
  clearQuizState,
  restoreQuizAfterAuth,
  checkAuthAndLoadResults,
  resetProcessingState,
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

type ViewState = 'initializing' | 'loading' | 'show_results' | 'show_signin' | 'no_results'

export default function GenericQuizResultHandler({ slug, quizType, children }: Props) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const { isAuthenticated, isLoading: isAuthLoading, login } = useAuth()
  
  // Combined ready state
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  
  // Redux state
  const quizResults = useSelector(selectQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const isCompleted = useSelector(selectIsQuizComplete)
  const isProcessingResults = useSelector(selectIsProcessingResults)
  const isPersistedReady = useSelector((state: any) => state._persist?.rehydrated === true)

  // Refs to track operations
  const hasRequestedResults = useRef(false)
  const hasRestoredAfterAuth = useRef(false)
  const mountedRef = useRef(true)

  // Debug logging
  const logDebug = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[QuizResultHandler] ${message}`, data || '')
    }
  }
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])
  
  // Check if system is ready (store hydrated + auth state resolved)
  useEffect(() => {
    if (isPersistedReady && !isAuthLoading) {
      logDebug('System ready')
      setIsReady(true)
      return
    }

    // Fallback timer to prevent blocking
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        logDebug('Fallback system ready')
        setIsReady(true)
      }
    }, 3000)  // 3 seconds timeout
    
    return () => clearTimeout(timer)
  }, [isPersistedReady, isAuthLoading])

  // Reset state when slug changes
  useEffect(() => {
    logDebug(`Slug changed to: ${slug}`)
    hasRequestedResults.current = false
    hasRestoredAfterAuth.current = false
    setError(null)
    setRetryCount(0)
  }, [slug])
  
  // Check if we have matching results
  const hasMatchingResults = useMemo(() => {
    const hasResults = Boolean(
      quizResults && 
      quizResults.slug === slug &&
      quizResults.data &&
      typeof quizResults.percentage === 'number'
    )
    
    logDebug(`Results check: ${hasResults}`, {
      hasQuizResults: !!quizResults,
      resultSlug: quizResults?.slug,
      currentSlug: slug,
      hasData: !!quizResults?.data
    })
    
    return hasResults
  }, [quizResults, slug])

  // Loading state detection
  const isLoading = useMemo(() => {
    if (!isReady) return false
    
    return (
      quizStatus === 'loading' || 
      isProcessingResults ||
      (hasRequestedResults.current && !hasMatchingResults)
    )
  }, [isReady, quizStatus, isProcessingResults, hasMatchingResults])

  // Enhanced result loading with better error handling
  const loadResults = useCallback(async () => {
    if (!mountedRef.current) return
    
    try {
      logDebug(`Loading results for ${slug}, retry: ${retryCount}`)
      
      await dispatch(checkAuthAndLoadResults({
        slug,
        authStatus: isAuthenticated ? 'authenticated' : 'unauthenticated',
      })).unwrap()
      
      logDebug('Results loaded successfully')
      setError(null)
    } catch (error) {
      if (!mountedRef.current) return
      
      const errorMsg = error instanceof Error ? error.message : 'Failed to load results'
      logDebug(`Load error: ${errorMsg}`)
      
      if (retryCount < 2) {
        // Exponential backoff for retries
        const delay = 1000 * Math.pow(2, retryCount)
        setTimeout(() => {
          if (mountedRef.current) {
            setRetryCount(prev => prev + 1)
          }
        }, delay)
      } else {
        setError(errorMsg)
      }
    }
  }, [slug, isAuthenticated, dispatch, retryCount])
  
  // Main effect for loading results
  useEffect(() => {
    if (!isReady || !slug) return
    
    // Don't load if we already have matching results
    if (hasMatchingResults) {
      logDebug('Skipping load - already have matching results')
      return
    }
    
    // Don't load if already loading or already requested
    if (isLoading || hasRequestedResults.current) return
    
    // Don't load if there's an error (user needs to manually retry)
    if (error) return
    
    logDebug('Initiating result load')
    hasRequestedResults.current = true
    loadResults()
  }, [isReady, slug, hasMatchingResults, isLoading, error, loadResults])

  // Restore after authentication
  useEffect(() => {
    if (!isReady || !isAuthenticated) return
    
    // Only restore if we don't have results and haven't already tried
    if (hasMatchingResults || hasRestoredAfterAuth.current) return

    logDebug('Restoring after auth')
    hasRestoredAfterAuth.current = true
    
    dispatch(restoreQuizAfterAuth()).catch((error) => {
      logDebug('Restore failed, will try normal load', error)
      // If restore fails, try normal loading
      hasRequestedResults.current = false
    })
  }, [isAuthenticated, isReady, hasMatchingResults, dispatch])

  // Add timeout effect to prevent stuck loading states
  useEffect(() => {
    if (!isReady || !isProcessingResults) return

    logDebug('Starting processing state timeout monitoring')
    
    // Set up a timeout to automatically reset the processing state if it gets stuck
    const processingTimeout = setTimeout(() => {
      if (mountedRef.current && isProcessingResults) {
        logDebug('Processing results stuck for too long, automatically resetting')
        dispatch(resetProcessingState())
      }
    }, 10000) // 10 seconds timeout
    
    return () => clearTimeout(processingTimeout)
  }, [isReady, isProcessingResults, dispatch])

  // View state calculation
  const viewState: ViewState = useMemo(() => {
    if (!isReady) return 'initializing'
    
    if (isLoading) return 'loading'
    
    if (hasMatchingResults) {
      return isAuthenticated ? 'show_results' : 'show_signin'
    }
    
    return 'no_results'
  }, [isReady, isLoading, hasMatchingResults, isAuthenticated])

  // Event handlers
  const handleRetake = useCallback(() => {
    logDebug('Retaking quiz')
    dispatch(clearQuizState())
    router.push(`/dashboard/${quizType}/${slug}`)
  }, [dispatch, router, quizType, slug])

  const handleSignIn = useCallback(() => {
    logDebug('Signing in')
    login('credentials', {
      callbackUrl: `/dashboard/${quizType}/${slug}/results`,
    })
  }, [login, quizType, slug])

  const handleRetry = useCallback(() => {
    logDebug('Manual retry')
    setError(null)
    setRetryCount(0)
    hasRequestedResults.current = false
    hasRestoredAfterAuth.current = false
  }, [])

  // Render functions
  const renderInitializing = () => (
    <motion.div
      key="initializing"
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
        <div className="text-xs text-muted-foreground text-center animate-pulse">
          Preparing your quiz experience...
        </div>
      </div>
      
      <div className="bg-muted/20 p-6 rounded-lg mt-4 mb-4">
        <div className="flex justify-center mb-4">
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )

  const renderLoading = () => (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-lg mx-auto mt-6 px-4"
    >      <div className="flex flex-col items-center justify-center mb-4">
        <div className="p-3 bg-muted/30 rounded-full mb-4">
          <div className="h-10 w-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
        <div className="text-sm font-medium mb-2">Loading your quiz results...</div>
        {retryCount > 0 && (
          <div className="text-xs text-muted-foreground">
            Attempt {retryCount + 1} of 3
          </div>
        )}
        {isProcessingResults && (
          <button 
            onClick={() => {
              logDebug('Manually resetting processing state')
              dispatch(resetProcessingState())
            }}
            className="text-xs text-blue-500 hover:underline mt-2"
          >
            Having trouble? Click here
          </button>
        )}
      </div>

      <div className="bg-muted/20 p-6 rounded-lg mt-4 mb-4">
        <div className="flex justify-center mb-4">
          <Skeleton className="h-10 w-20 rounded-md" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
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
        title={error ? "Something Went Wrong" : "Quiz Results Not Found"}
        description={
          error 
            ? `${error}. Please try again.`
            : "We couldn't find your quiz results. You may not have completed the quiz, or your session expired."
        }
        action={{
          label: error ? 'Try Again' : 'Retake Quiz',
          onClick: error ? handleRetry : handleRetake,
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

  return (
    <AnimatePresence mode="wait" initial={false}>
      {viewState === 'initializing' && renderInitializing()}
      {viewState === 'loading' && renderLoading()}
      {viewState === 'show_results' && quizResults && renderResults()}
      {viewState === 'show_signin' && renderSignIn()}
      {viewState === 'no_results' && renderNoResults()}
    </AnimatePresence>
  )
}