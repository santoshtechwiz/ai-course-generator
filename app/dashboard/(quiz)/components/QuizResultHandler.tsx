'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { createMachine } from 'xstate'
import { useMachine } from '@xstate/react'

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
import { QuizType } from '@/app/types/quiz-types'
import { GlobalLoader } from '@/components/ui/loader'

interface Props {
  slug: string
  quizType: QuizType
  children: (props: { result: any }) => React.ReactNode
}

// Define the quiz result state machine with simplified events
const quizResultMachine = createMachine({
  id: 'quizResultMachine',
  initial: 'loading',
  states: {
    loading: {
      on: {
        RESULTS_LOADED_WITH_AUTH: 'showResults',
        RESULTS_LOADED_NO_AUTH: 'showSignin',
        NO_RESULTS: 'noResults',
        ERROR: 'error'
      }
    },
    showResults: {
      on: {
        REFRESH: 'loading'
      }
    },
    showSignin: {
      on: {
        SIGN_IN: 'loading',
        RETAKE: 'loading',
        RESULTS_LOADED_WITH_AUTH: 'showResults' // Add direct transition when authenticated
      }
    },
    error: {
      on: {
        RETRY: 'loading',
        RETAKE: 'loading'
      }
    },
    noResults: {
      on: {
        RETAKE: 'loading'
      }
    }
  }
});

export default function GenericQuizResultHandler({ slug, quizType, children }: Props) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { isAuthenticated, isInitialized, isLoading: isAuthLoading, login } = useAuth()

  const quizResults = useSelector(selectQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const quizQuestions = useSelector(selectQuizQuestions)
  
  // For storing error message
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Initialize the state machine
  const [state, send] = useMachine(quizResultMachine);
  
  // Check if we have results
  const hasResults = useMemo(() => {
    return quizResults?.slug === slug && typeof quizResults?.percentage === 'number'
  }, [quizResults, slug])
  // Load results after auth is initialized and determine state
  useEffect(() => {
    if (!slug || !isInitialized) return

    // If we already have results and user is authenticated, immediately show results
    // This handles the case when user returns from sign-in page
    if (hasResults && isAuthenticated) {
      send({ type: 'RESULTS_LOADED_WITH_AUTH' });
      return;
    }

    dispatch(checkAuthAndLoadResults())
      .unwrap()
      .then(() => {
        // Determine the appropriate state based on results and authentication
        if (hasResults) {
          if (isAuthenticated) {
            send({ type: 'RESULTS_LOADED_WITH_AUTH' });
          } else {
            send({ type: 'RESULTS_LOADED_NO_AUTH' });
          }
        } else {
          send({ type: 'NO_RESULTS' });
        }
      })
      .catch((err: any) => {
        const message = err instanceof Error ? err.message : 'Failed to load results'
        setErrorMessage(message);
        send({ type: 'ERROR' });
      })
  }, [slug, isInitialized, dispatch, send, hasResults, isAuthenticated])

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
      questionResults: quizResults.results?.map((result) => {
        const answerDetail = quizResults.answers?.find(
          (answer) => answer.questionId === result.questionId
        )

        const questionData = quizQuestions?.find(
          (q) => String(q.id) === result.questionId
        )

        return {
          questionId: result.questionId,
          question: questionData?.question || result.questionId,
          userAnswer:
            result.userAnswer === null || result.userAnswer === undefined
              ? '(No answer selected)'
              : result.userAnswer || '',
          correctAnswer: result.correctAnswer || '',
          isCorrect: result.isCorrect,
          type: answerDetail?.type || 'mcq',
          selectedOptionId: answerDetail?.selectedOptionId || '',
          options: questionData?.options || [],
        }
      }) || [],
    }
  }, [quizResults, quizQuestions, slug])

  const isLoading = quizStatus === 'loading' || isAuthLoading || !isInitialized

  // Handle retake quiz action
  const handleRetake = () => {
    dispatch(clearQuizState())
    send({ type: 'RETAKE' })
    router.push(`/dashboard/${quizType}/${slug}`)
  }

  // Handle retry loading action
  const handleRetry = () => {
    setErrorMessage(null)
    send({ type: 'RETRY' })
    router.refresh()
  }
  // Handle sign in action
  const handleSignIn = () => {
    send({ type: 'SIGN_IN' })
    login('credentials', {
      callbackUrl: `/dashboard/${quizType}/${slug}/results`,
    })
  }
  
  // Effect to handle authentication changes
  useEffect(() => {
    // When authentication state changes to authenticated and we have results,
    // transition to results state regardless of current state
    if (isAuthenticated && hasResults && isInitialized) {
      send({ type: 'RESULTS_LOADED_WITH_AUTH' });
    }
  }, [isAuthenticated, hasResults, isInitialized, send]);

  // Render loading state
  if (isLoading) {
    return (
      <GlobalLoader 
        fullScreen={true}
        size="lg"
        text="AI is generating your personalized quiz results"
        subText="Crafting personalized content with advanced AI technology"
        theme="primary"
      />
    )
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {/* Show results state */}
      {state.matches('showResults') && (
        <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {children({ result: processedResults })}
        </motion.div>
      )}

      {/* Show sign in prompt state */}
      {state.matches('showSignin') && (
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

      {/* Error state */}
      {state.matches('error') && (
        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <NoResults
            variant="quiz"
            title="Error Loading Quiz"
            description={`${errorMessage || 'Unknown error'}. Please try again.`}
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

      {/* No results state */}
      {state.matches('noResults') && (
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
