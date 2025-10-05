'use client'

import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { useAppDispatch } from '@/store/hooks'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

import { NoResults } from '@/components/ui/no-results'
import SignInPrompt from '@/app/auth/signin/components/SignInPrompt'
import { UnifiedLoader } from '@/components/loaders'
import { LOADER_MESSAGES } from '@/constants/loader-messages'

import { useAuth } from '@/modules/auth'
import { storageManager } from '@/utils/storage-manager'
import {
  selectQuizResults,
  selectQuizStatus,
  selectQuizQuestions,
  loadQuizResults,
  loadTempResultsAndSave,
  resetQuiz,
  setQuizResults,
} from '@/store/slices/quiz/quiz-slice'

import { QuizType } from '@/app/types/quiz-types'

interface Props {
  slug: string
  quizType: QuizType
  children: (props: { result: any }) => React.ReactNode
}

type ViewState = 'loading' | 'calculating' | 'showResults' | 'showSignin' | 'error' | 'redirecting'

export default function GenericQuizResultHandler({ slug, quizType, children }: Props) {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()

  const quizResults = useSelector(selectQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const quizQuestions = useSelector(selectQuizQuestions)
  
  // Simple state management
  const [viewState, setViewState] = useState<ViewState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Refs to prevent multiple loads
  const tempResultsLoadedRef = useRef(false)
  const hasInitialized = useRef(false)
  
  // Check if we have valid results
  const hasResults = useMemo(() => {
    return Boolean(
      quizResults &&
      quizResults.slug === slug && 
      (typeof quizResults.percentage === 'number' || 
       typeof quizResults.score === 'number' ||
       Array.isArray(quizResults.results) && quizResults.results.length > 0)
    )
  }, [quizResults, slug])

  // Process results for display
  const processedResults = useMemo(() => {
    if (!quizResults) return null

    return {
      ...quizResults,
      title: slug || 'Quiz Results',
      questions: quizQuestions || [],
      score: quizResults.score || 0,
      maxScore: quizResults.maxScore || 0,
      percentage: quizResults.percentage || 0,
      submittedAt: quizResults.submittedAt || new Date().toISOString(),
      completedAt: quizResults.completedAt || new Date().toISOString(),
      questionResults: Array.isArray(quizResults.results) ? quizResults.results.map((result) => {
        const answerDetail = quizResults.answers?.find(
          (answer) => answer.questionId === result.questionId
        )
        const questionData = quizQuestions?.find(
          (q) => String(q.id) === result.questionId
        )
        return {
          questionId: result.questionId,
          question: questionData?.question || result.questionId,
          userAnswer: result.userAnswer === null || result.userAnswer === undefined
            ? '(No answer selected)'
            : result.userAnswer || '',
          correctAnswer: result.correctAnswer || questionData?.answer || '',
          isCorrect: result.isCorrect,
          type: answerDetail?.type || 'mcq',
          selectedOptionId: answerDetail?.selectedOptionId || '',
          options: questionData?.options || [],
          explanation: (questionData as any)?.explanation || (result as any)?.explanation || '',
          difficulty: (result as any)?.difficulty || '',
          category: (questionData as any)?.category || (result as any)?.category || '',
        }
      }) : [],
    }
  }, [quizResults, quizQuestions, slug])

  // Initialize and load results
  useEffect(() => {
    if (!slug || isAuthLoading) return

    console.log('[QuizResultHandler] Initializing for slug:', slug, 'isAuthenticated:', isAuthenticated)

    // Clear mismatched results
    if (quizResults && quizResults.slug !== slug) {
      console.log('[QuizResultHandler] Clearing mismatched results')
      dispatch(resetQuiz())
      hasInitialized.current = false
      tempResultsLoadedRef.current = false
      return
    }

    // Check for temporary results first (from unauthenticated submission)
    const tempResults = storageManager.getTempQuizResults(slug, quizType)
    if (tempResults && !tempResultsLoadedRef.current) {
      tempResultsLoadedRef.current = true
      console.log('[QuizResultHandler] Found temp results, isAuthenticated:', isAuthenticated)
      
      if (isAuthenticated) {
        console.log('[QuizResultHandler] User is authenticated, saving temp results to DB')
        setViewState('calculating')
        dispatch(loadTempResultsAndSave({ slug, quizType }))
          .unwrap()
          .then(() => {
            console.log('[QuizResultHandler] Temp results saved to DB successfully')
            setViewState('showResults')
          })
          .catch((err: any) => {
            console.error('[QuizResultHandler] Failed to save temp results:', err)
            // Don't clear temp results on error - user can try again
            setErrorMessage('Failed to save results. Please try again.')
            setViewState('error')
          })
      } else {
        console.log('[QuizResultHandler] User not authenticated, loading temp results and showing sign-in prompt')
        dispatch(setQuizResults(tempResults.results))
        setViewState('showSignin')
      }
      hasInitialized.current = true
      return
    }

    // If initialization already completed and we have results
    if (hasInitialized.current) {
      if (hasResults) {
        console.log('[QuizResultHandler] Already initialized with results')
        if (isAuthenticated && viewState !== 'showResults') {
          setViewState('showResults')
        } else if (!isAuthenticated && viewState !== 'showSignin') {
          setViewState('showSignin')
        }
      }
      return
    }

    // Mark as initialized
    hasInitialized.current = true

    // If we already have matching results in Redux state
    if (hasResults) {
      console.log('[QuizResultHandler] Found existing results in state')
      if (isAuthenticated) {
        setViewState('showResults')
      } else {
        setViewState('showSignin')
      }
      return
    }

    // Try to load from API for authenticated users
    if (isAuthenticated) {
      console.log('[QuizResultHandler] Attempting to load from API')
      dispatch(loadQuizResults())
        .unwrap()
        .then(() => {
          console.log('[QuizResultHandler] Loaded results from API')
          setViewState('showResults')
        })
        .catch((err: any) => {
          console.log('[QuizResultHandler] No results found in API, redirecting to quiz')
          handleRetake()
        })
    } else {
      // Unauthenticated user with no temp results - redirect to quiz
      console.log('[QuizResultHandler] No results found for unauthenticated user, redirecting')
      handleRetake()
    }
  }, [slug, isAuthLoading, dispatch, hasResults, isAuthenticated, quizResults, quizType, viewState])

  // Handle authentication changes - specifically for returning from sign-in
  useEffect(() => {
    if (isAuthLoading) return

    // When user becomes authenticated and we have temp results, trigger reload
    if (isAuthenticated && !hasResults) {
      const tempResults = storageManager.getTempQuizResults(slug, quizType)
      if (tempResults && !tempResultsLoadedRef.current) {
        console.log('[QuizResultHandler] User authenticated with temp results, reloading')
        hasInitialized.current = false // Reset to trigger reload
        tempResultsLoadedRef.current = false
      }
    }
  }, [isAuthenticated, hasResults, isAuthLoading, slug, quizType])

  // Show calculating when status changes
  useEffect(() => {
    if (quizStatus === 'loading' && hasResults && viewState === 'loading') {
      setViewState('calculating')
    }
  }, [quizStatus, hasResults, viewState])

  // Handlers
  const handleRetake = () => {
    console.log('[QuizResultHandler] Retaking quiz')
    setViewState('redirecting')
    dispatch(resetQuiz())
    router.push(`/dashboard/${quizType}/${slug}`)
  }

  const handleSignIn = () => {
    console.log('[QuizResultHandler] Redirecting to sign in')
    window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/${quizType}/${slug}/results`)}`
  }

  const handleRetry = () => {
    console.log('[QuizResultHandler] Retrying')
    setErrorMessage(null)
    hasInitialized.current = false
    setViewState('loading')
    router.refresh()
  }

  // Render based on state
  if (viewState === 'calculating') {
    return (
      <motion.div 
        key="calculating"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-background z-50"
      >
        <div className="text-center space-y-4 px-4">
          <UnifiedLoader
            state="loading"
            variant="spinner"
            size="lg"
            message={LOADER_MESSAGES.CALCULATING_RESULTS}
            className="text-center"
          />
          <p className="text-sm text-muted-foreground animate-pulse">
            Please wait while we analyze your answers
          </p>
        </div>
      </motion.div>
    )
  }

  if (viewState === 'loading' || viewState === 'redirecting' || isAuthLoading) {
    return (
      <motion.div
        key="loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 flex items-center justify-center bg-background z-50"
      >
        <UnifiedLoader
          state="loading"
          variant="spinner"
          size="lg"
          message={viewState === 'redirecting' ? LOADER_MESSAGES.REDIRECTING_TO_QUIZ : LOADER_MESSAGES.LOADING_RESULTS}
          className="text-center"
        />
      </motion.div>
    )
  }

  if (viewState === 'error') {
    return (
      <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <NoResults
          variant="quiz"
          title="Error Loading Quiz"
          description={errorMessage || 'Failed to load quiz results. Please try again.'}
          action={{
            label: 'Go to Quiz',
            onClick: handleRetake,
            icon: <RefreshCw className="h-4 w-4" />,
            variant: 'default',
          }}
          secondaryAction={{
            label: 'Try Again',
            onClick: handleRetry,
            variant: 'outline',
          }}
        />
      </motion.div>
    )
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {viewState === 'showResults' && processedResults && (
        <motion.div 
          key="results" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {children({ result: processedResults })}
        </motion.div>
      )}

      {viewState === 'showSignin' && quizResults && (
        <motion.div 
          key="signin" 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <SignInPrompt
            onSignIn={handleSignIn}
            onRetake={handleRetake}
            quizType={quizType}
            previewData={{
              percentage: quizResults.percentage || 0,
              score: quizResults.score || 0,
              maxScore: quizResults.maxScore || 0,
              correctAnswers: quizResults.score || 0,
              totalQuestions: quizResults.maxScore || 0,
              stillLearningAnswers: (quizResults.maxScore || 0) - (quizResults.score || 0),
              incorrectAnswers: (quizResults.maxScore || 0) - (quizResults.score || 0),
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
