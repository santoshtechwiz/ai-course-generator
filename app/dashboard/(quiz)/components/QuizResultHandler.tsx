'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { createMachine } from 'xstate'
import { useMachine } from '@xstate/react'

import { NoResults } from '@/components/ui/no-results'
import SignInPrompt from '@/app/auth/signin/components/SignInPrompt'
import { Progress } from '@/components/ui/progress'

import { useAuth } from '@/modules/auth'
import { storageManager } from '@/utils/storage-manager'
import {
  selectQuizResults,
  selectQuizStatus,
  selectQuizQuestions,
  loadQuizResults,
  clearRequiresAuth,
  loadTempResultsAndSave,
  resetQuiz,
  setQuizResults,
} from '@/store/slices/quiz/quiz-slice'

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

// Define a simplified quiz result state machine with fewer intermediate states
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
        // Direct transition to quiz without intermediate states
        RETAKE: 'loading'
      }
    },
    showResults: {
      on: {
        REFRESH: 'loading',
        RETAKE: 'loading'
      }
    },
    showSignin: {
      on: {
        SIGN_IN: 'loading',
        RETAKE: 'loading',
        RESULTS_LOADED_WITH_AUTH: 'showResults'
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
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()

  const quizResults = useSelector(selectQuizResults)
  const quizStatus = useSelector(selectQuizStatus)
  const quizQuestions = useSelector(selectQuizQuestions)
  
  // For storing error message
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false)
  
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
    // Clear any existing results from different quiz types on component mount
  useEffect(() => {
    if (quizResults && quizResults.slug !== slug) {
      // If current stored results are for a different quiz, clear them
      dispatch(resetQuiz());
    }
  }, [dispatch, quizResults, slug]);

  // Monitor quiz status for authentication requirements
  useEffect(() => {
    if (quizStatus === 'requires-auth' && hasResults) {
      console.log('Quiz requires authentication, showing sign-in prompt with results')
      send({ type: 'RESULTS_LOADED_NO_AUTH' });
    }
  }, [quizStatus, hasResults, send]);

  // Optimized effect for loading results
  useEffect(() => {
    if (!slug || isAuthLoading) return

    // First, check for temporary results from unauthenticated submission
    const tempResults = storageManager.getTempQuizResults(slug, quizType)
    if (tempResults) {
      if (isAuthenticated) {
        console.log('Found temporary results, loading and saving to DB...')
        dispatch(loadTempResultsAndSave({ slug, quizType }))
          .unwrap()
          .then(() => {
            console.log('Successfully loaded and saved temp results')
            send({ type: 'RESULTS_LOADED_WITH_AUTH' });
          })
          .catch((err: any) => {
            console.error('Failed to load and save temp results:', err)
            // Clear temp results on failure
            storageManager.clearTempQuizResults(slug, quizType)
            handleRetake();
          });
      } else {
        console.log('Found temporary results for unauthenticated user, showing sign-in prompt')
        // Load temp results into Redux state for display
        dispatch(setQuizResults(tempResults.results))
        send({ type: 'RESULTS_LOADED_NO_AUTH' });
      }
      return;
    }

    // Check for direct URL access first
    try {
      // Modern approach to detect direct URL access
      const isDirect = document.referrer === '';
      const isFromExternalDomain = document.referrer !== '' && 
        !document.referrer.includes(window.location.hostname);
        
      if (isDirect || isFromExternalDomain) {
        // For direct access, try to load results from API
        console.log('Direct URL access detected, checking for saved results...')
        dispatch(clearRequiresAuth())
        
        // Check if we have results after clearing auth requirement
        const hasResults = quizResults && (
          quizResults.score !== undefined ||
          quizResults.percentage !== undefined ||
          quizResults.maxScore !== undefined ||
          (quizResults.answers && Object.keys(quizResults.answers).length > 0) ||
          (quizResults.results && quizResults.results.length > 0)
        )

        if (hasResults) {
          console.log('Found existing results in state')
          send({ type: 'RESULTS_LOADED_WITH_AUTH' });
        } else {
          console.log('No saved results found, redirecting to quiz')
          handleRetake();
        }
        return;
      }
    } catch (e) {
      // Continue with normal flow if detection fails
    }

    // Clear any results that don't match the current slug
    if (quizResults && quizResults.slug !== slug) {
      dispatch(resetQuiz());
    }

    // If we already have matching results and user is authenticated, immediately show results
    if (hasResults && isAuthenticated) {
      console.log('Found existing results in state, showing immediately')
      send({ type: 'RESULTS_LOADED_WITH_AUTH' });
      return;
    }

    // If user is not authenticated but we have results, show sign-in prompt
    if (hasResults && !isAuthenticated) {
      console.log('Have results but user not authenticated, showing sign-in prompt')
      send({ type: 'RESULTS_LOADED_NO_AUTH' });
      return;
    }

    // If no results in state, try to fetch from API
    if (!hasResults) {
      console.log('No results in state, attempting to load from API...')
      dispatch(loadQuizResults())
        .unwrap()
        .then(() => {
          console.log('Successfully loaded results from API')
          if (isAuthenticated) {
            send({ type: 'RESULTS_LOADED_WITH_AUTH' });
          } else {
            send({ type: 'RESULTS_LOADED_NO_AUTH' });
          }
        })
        .catch((err: any) => {
          console.log('Failed to load results from API, redirecting to quiz:', err.error)
          // No results found, redirect to quiz
          handleRetake();
        });
    }
      
  }, [slug, isAuthLoading, dispatch, send, hasResults, isAuthenticated, quizResults]); // eslint-disable-line react-hooks/exhaustive-deps

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
          userAnswer:
            result.userAnswer === null || result.userAnswer === undefined
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

  const isLoading = quizStatus === 'loading' || isAuthLoading  // Simplified retake function with immediate redirect
  const handleRetake = () => {
    // Flag that we're redirecting to prevent other state changes
    setIsRedirecting(true);
    
    // Clear quiz state immediately to prevent issues with shared state
    dispatch(resetQuiz());
    
    // Tell state machine we're taking action
    send({ type: 'RETAKE' });
    
    // Always navigate to the quiz page directly
    router.push(`/dashboard/${quizType}/${slug}`);
  }// Simplified retry function with cleaner feedback
  const handleRetry = () => {
    // Reset error state
    setErrorMessage(null);
    
    // Clear quiz state to start fresh
    dispatch(resetQuiz());
    
    // Set loading state
    send({ type: 'RETRY' });
    
    // Just refresh the page - simple and effective
    setTimeout(() => {
      router.refresh();
    }, 100);
    
    // Set a backup timeout to redirect to quiz if refresh doesn't help
    setTimeout(() => {
      if (state.matches('loading') || state.matches('error')) {
        handleRetake(); // Redirect to quiz if still loading or error
      }
    }, 4000);
  }
    // Handle sign in action
  const handleSignIn = () => {
    send({ type: 'SIGN_IN' })
    // Redirect to sign-in page with proper callback URL
    window.location.href = `/api/auth/signin?callbackUrl=${encodeURIComponent(`/dashboard/${quizType}/${slug}/results`)}`
  }
    // Effect to handle authentication changes
  useEffect(() => {
    // When authentication state changes to authenticated and we have results,
    // transition to results state regardless of current state
    if (isAuthenticated && hasResults && !isAuthLoading) {
      console.log('User authenticated with existing results, showing results')
      send({ type: 'RESULTS_LOADED_WITH_AUTH' });
    }
    // If user becomes authenticated but no results, try to load them
    else if (isAuthenticated && !hasResults && !isAuthLoading && slug) {
      console.log('User authenticated but no results, attempting to load...')
      dispatch(loadQuizResults())
        .unwrap()
        .then(() => {
          send({ type: 'RESULTS_LOADED_WITH_AUTH' });
        })
        .catch(() => {
          // If still no results after authentication, redirect to quiz
          console.log('No results found after authentication, redirecting to quiz')
          handleRetake();
        });
    }
  }, [isAuthenticated, hasResults, isAuthLoading, send, slug, dispatch]); // eslint-disable-line react-hooks/exhaustive-deps
    // Simplified loading timeout effect that redirects if results can't be loaded
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    // If in loading state, set a reasonable timeout to prevent infinite loading
    if (state.matches('loading')) {
      timeoutId = setTimeout(() => {
        // If we're still loading after timeout, show error and give option to retry
        if (!isRedirecting) {
          send({ type: 'ERROR' });
          setErrorMessage('Results could not be loaded. Please try again or return to the quiz.');
        }
      }, 5000); // 5-second timeout for loading is more reasonable
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [state.value, isRedirecting]); // eslint-disable-line react-hooks/exhaustive-deps  // Automatic redirection for no results
  useEffect(() => {
    // If we're in the noResults state, redirect immediately
    if (state.matches('noResults') && !isRedirecting) {
      handleRetake();
    }
  }, [state.value, isRedirecting]); // eslint-disable-line react-hooks/exhaustive-deps// Render loading or redirecting states with a single consistent loader
  if (isLoading || state.matches('loading') || isRedirecting) {
    const isRedirectingToQuiz = isRedirecting;
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
        <span className="h-8 w-8 inline-block rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
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
      )}      {/* Error state - simplified with auto-redirect */}
      {state.matches('error') && (
        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <NoResults
            variant="quiz"
            title="Error Loading Quiz"
            description={`${errorMessage || 'Failed to load quiz results'}. Automatically redirecting to quiz.`}
            action={{
              label: 'Go to Quiz Now',
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
          <AutoRedirect onRedirect={handleRetake} delay={2000} />
        </motion.div>
      )}
        {/* No results state - immediate redirect */}
      {state.matches('noResults') && (
        <>{handleRetake()}</>
      )}
    </AnimatePresence>
  )
}
