/**
 * Unified loading state management hook
 * Replaces the inconsistent loading slice pattern
 */

import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useMemo } from 'react'

// Loading state from different slices
export function useLoadingState() {
  const quizLoading = useSelector((state: RootState) => state.quiz.status === 'loading')
  const flashcardLoading = useSelector((state: RootState) => state.flashcard.status === 'loading')
  const courseProgressLoading = useSelector((state: RootState) => state.courseProgress.isLoading)
  const subscriptionLoading = useSelector((state: RootState) => state.subscription.isLoading)

  const isLoading = quizLoading || flashcardLoading || courseProgressLoading || subscriptionLoading

  const loadingStates = useMemo(() => ({
    quiz: quizLoading,
    flashcard: flashcardLoading,
    courseProgress: courseProgressLoading,
    subscription: subscriptionLoading,
    global: isLoading
  }), [quizLoading, flashcardLoading, courseProgressLoading, subscriptionLoading, isLoading])

  return loadingStates
}

// Error state from different slices
export function useErrorState() {
  const quizError = useSelector((state: RootState) => state.quiz.error)
  const flashcardError = useSelector((state: RootState) => state.flashcard.error)
  const courseProgressError = useSelector((state: RootState) => state.courseProgress.error)
  const subscriptionError = useSelector((state: RootState) => state.subscription.error)

  const hasError = !!(quizError || flashcardError || courseProgressError || subscriptionError)

  const errorStates = useMemo(() => ({
    quiz: quizError,
    flashcard: flashcardError,
    courseProgress: courseProgressError,
    subscription: subscriptionError,
    hasAnyError: hasError,
    firstError: quizError || flashcardError || courseProgressError || subscriptionError
  }), [quizError, flashcardError, courseProgressError, subscriptionError, hasError])

  return errorStates
}

// Combined loading and error state for components
export function useAsyncState() {
  const loading = useLoadingState()
  const errors = useErrorState()

  return {
    loading,
    errors,
    isLoading: loading.global,
    hasError: errors.hasAnyError,
    error: errors.firstError
  }
}

// Specific hooks for different features
export function useQuizState() {
  const quiz = useSelector((state: RootState) => state.quiz)
  
  return {
    ...quiz,
    isLoading: quiz.status === 'loading',
    isSubmitting: quiz.status === 'submitting',
    hasError: quiz.status === 'failed',
    isSuccess: quiz.status === 'succeeded',
    isNotFound: quiz.status === 'not-found',
    hasData: quiz.questions.length > 0
  }
}

export function useFlashcardState() {
  const flashcard = useSelector((state: RootState) => state.flashcard)
  
  return {
    ...flashcard,
    isLoading: flashcard.status === 'loading',
    isSubmitting: flashcard.status === 'submitting',
    hasError: flashcard.status === 'failed',
    isSuccess: flashcard.status === 'succeeded',
    hasData: flashcard.questions.length > 0
  }
}

export function useSubscriptionState() {
  const subscription = useSelector((state: RootState) => state.subscription)
  
  return {
    ...subscription,
    hasData: !!subscription.currentSubscription,
    isFetching: subscription.isFetching
  }
}

// Hook for checking if data is stale and needs refresh
export function useDataFreshness() {
  const quiz = useSelector((state: RootState) => state.quiz)
  const flashcard = useSelector((state: RootState) => state.flashcard)
  
  const STALENESS_THRESHOLD = 5 * 60 * 1000 // 5 minutes
  const now = Date.now()
  
  const freshness = useMemo(() => ({
    quiz: {
      isStale: quiz.lastUpdated ? (now - quiz.lastUpdated) > STALENESS_THRESHOLD : true,
      lastUpdated: quiz.lastUpdated,
      age: quiz.lastUpdated ? now - quiz.lastUpdated : null
    },
    flashcard: {
      isStale: flashcard.lastUpdated ? (now - flashcard.lastUpdated) > STALENESS_THRESHOLD : true,
      lastUpdated: flashcard.lastUpdated,
      age: flashcard.lastUpdated ? now - flashcard.lastUpdated : null
    }
  }), [quiz.lastUpdated, flashcard.lastUpdated, now])

  return freshness
}

// Hook for components that need to show loading skeleton vs error state
export function useComponentState(feature: 'quiz' | 'flashcard' | 'subscription') {
  const loading = useLoadingState()
  const errors = useErrorState()
  
  const isLoading = loading[feature]
  const error = errors[feature]
  const hasError = !!error
  
  // Determine what to render
  const shouldShowSkeleton = isLoading && !hasError
  const shouldShowError = hasError && !isLoading
  const shouldShowContent = !isLoading && !hasError
  
  return {
    isLoading,
    error,
    hasError,
    shouldShowSkeleton,
    shouldShowError,
    shouldShowContent
  }
}