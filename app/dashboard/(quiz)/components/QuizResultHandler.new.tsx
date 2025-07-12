'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw, Loader2 } from 'lucide-react'
import { createMachine } from 'xstate'
import { useMachine } from '@xstate/react'

import { Skeleton } from '@/components/ui/skeleton'
import { NoResults } from '@/components/ui/no-results'
import SignInPrompt from '@/app/auth/signin/components/SignInPrompt'
import { Progress } from '@/components/ui/progress'

import { useAuth } from '@/modules/auth'
import {
  selectQuizResults,
  selectQuizStatus,
  selectQuizQuestions,
  clearQuizState,
  checkAuthAndLoadResults,
} from '@/store/slices/quiz-slice'
import { useGlobalLoader } from '@/store/global-loader'

import type { AppDispatch } from '@/store'
import { QuizType } from '@/app/types/quiz-types'

interface Props {
  slug: string
  quizType: QuizType
  children: (props: { result: any }) => React.ReactNode
}

// AutoRedirect component that automatically triggers a redirect after a delay
interface AutoRedirectProps {
  onRedirect: () => void;
  delay: number;
}

function AutoRedirect({ onRedirect, delay }: AutoRedirectProps) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    // Calculate how often to update progress to create smooth animation
    const interval = delay / 100;
    const step = 100 / (delay / interval);
    
    // Update progress bar
    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + step;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, interval);
    
    // Trigger redirect when complete
    const redirectTimer = setTimeout(() => {
      onRedirect();
    }, delay);
    
    return () => {
      clearInterval(timer);
      clearTimeout(redirectTimer);
    };
  }, [onRedirect, delay]);
  
  return (
    <div className="w-full mt-4">
      <Progress value={progress} className="h-1" />
      <p className="text-xs text-center text-muted-foreground mt-2">
        Redirecting in {Math.ceil((delay / 1000) * (1 - progress/100))} seconds...
      </p>
    </div>
  );
}

// Define the quiz result state machine with improved event handling and transitions
const quizResultMachine = createMachine({
  id: 'quizResultMachine',
  initial: 'loading',
  states: {
    loading: {
      on: {
        RESULTS_LOADED_WITH_AUTH: 'showResults',
        RESULTS_LOADED_NO_AUTH: 'showSignin',
        NO_RESULTS: 'noResults',
        ERROR: 'error',
        RETAKE: { 
          target: 'redirecting',
          // Add an action to be executed on this transition
          actions: ['clearQuizState'] 
        }
      }
    },
    showResults: {
      on: {
        REFRESH: 'loading',
        RETAKE: { 
          target: 'redirecting',
          actions: ['clearQuizState'] 
        }
      }
    },
    showSignin: {
      on: {
        SIGN_IN: 'loading',
        RETAKE: { 
          target: 'redirecting',
          actions: ['clearQuizState'] 
        },
        RESULTS_LOADED_WITH_AUTH: 'showResults'
      }
    },
    error: {
      on: {
        RETRY: 'loading',
        RETAKE: { 
          target: 'redirecting',
          actions: ['clearQuizState'] 
        }
      }
    },
    noResults: {
      on: {
        RETAKE: { 
          target: 'redirecting',
          actions: ['clearQuizState'] 
        }
      }
    },
    // Add a dedicated redirecting state for better UX
    redirecting: {
      // This state can be used to show transition animations
      // before navigating away
    }
  }
});

export default function GenericQuizResultHandler({ slug, quizType, children }: Props) {
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()

  const quizResults = useSelector(selectQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const quizQuestions = useSelector(selectQuizQuestions)
  
  // For storing error message
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Initialize the state machine
  const [state, send] = useMachine(quizResultMachine);
  
  // Check if we have results - use more robust checking
  const hasResults = useMemo(() => {
    return Boolean(
      quizResults &&
      quizResults.slug === slug && 
      (typeof quizResults.percentage === 'number' || 
       typeof quizResults.score === 'number' ||
       Array.isArray(quizResults.results) && quizResults.results.length > 0 || 
       Array.isArray(quizResults.answers) && quizResults.answers.length > 0)
    )
  }, [quizResults, slug])
  
  // Load results after auth is initialized and determine state
  useEffect(() => {
    if (!slug || isAuthLoading) return

    // If we already have results and user is authenticated, immediately show results
    // This handles the case when user returns from sign-in page
    if (hasResults && isAuthenticated) {
      send({ type: 'RESULTS_LOADED_WITH_AUTH' });
      return;
    }

    // Add a timeout to ensure we have time to load results
    const timeoutId = setTimeout(() => {
      dispatch(checkAuthAndLoadResults())
        .unwrap()
        .then(() => {
          // Re-check if we have results after loading
          const currentQuizResults = selectQuizResults({ quiz: { results: quizResults } } as any);
          const currentHasResults = Boolean(
            currentQuizResults &&
            currentQuizResults.slug === slug && 
            (typeof currentQuizResults.percentage === 'number' || 
             typeof currentQuizResults.score === 'number' ||
             Array.isArray(currentQuizResults.results) && currentQuizResults.results.length > 0 || 
             Array.isArray(currentQuizResults.answers) && currentQuizResults.answers.length > 0)
          );
          
          // Determine the appropriate state based on results and authentication
          if (currentHasResults) {
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
    }, 500); // Small delay to ensure state is properly initialized
    
    return () => clearTimeout(timeoutId);
  }, [slug, isAuthLoading, dispatch, send, hasResults, isAuthenticated, quizResults])

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

  const isLoading = quizStatus === 'loading' || isAuthLoading

  // Handle retake quiz action with enhanced UX
  const handleRetake = () => {
    // Clear quiz state first to ensure clean state
    dispatch(clearQuizState())
    
    // Show loading state before navigation
    send({ type: 'RETAKE' })
    
    // Short delay to show loading state before redirecting
    setTimeout(() => {
      // Navigate back to the quiz page
      router.push(`/dashboard/${quizType}/${slug}`)
    }, 300)
  }

  // Handle retry loading action with improved feedback
  const handleRetry = () => {
    setErrorMessage(null)
    send({ type: 'RETRY' })
    
    // Clear state and try loading again
    dispatch(clearQuizState())
    
    // Short delay to ensure redux state is cleared
    setTimeout(() => {
      router.refresh()
    }, 300)
  }
  
  // Handle sign in action  const handleSignIn = () => {
    send({ type: 'SIGN_IN' })
    // Redirect to sign-in page with proper callback URL
    window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/${quizType}/${slug}/results`)}`
  }
  
  // Effect to handle authentication changes
  useEffect(() => {
    // When authentication state changes to authenticated and we have results,
    // transition to results state regardless of current state
    if (isAuthenticated && hasResults && !isAuthLoading) {
      send({ type: 'RESULTS_LOADED_WITH_AUTH' });
    }
  }, [isAuthenticated, hasResults, isAuthLoading, send]);

  // Render loading state
  if (isLoading || state.matches('loading')) {
    return (
      <GlobalLoader 
        fullScreen={true}
        size="lg"
        text="Loading your quiz results"
        subText="Please wait while we retrieve your results"
        theme="primary"
        className="!z-50" // Ensure loader is on top
      />
    )
  }
  
  // Render redirecting state
  if (state.matches('redirecting')) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 max-w-lg mx-auto">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold tracking-tight">Preparing Your Quiz</h2>
          <p className="text-muted-foreground">
            Redirecting to your quiz page. Please wait...
          </p>
          <Progress value={100} className="h-1 animate-pulse" />
        </div>
      </div>
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

      {/* No results state - with auto-redirect effect */}
      {state.matches('noResults') && (
        <motion.div key="no-results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <NoResults
            variant="quiz"
            title="No Results Found"
            description="We couldn't find your quiz results. Redirecting to quiz..."
            action={{
              label: 'Retake Quiz Now',
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
          {/* Auto-redirect effect */}
          <AutoRedirect onRedirect={handleRetake} delay={3000} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
