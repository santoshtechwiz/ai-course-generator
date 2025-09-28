/**
 * Unified loading state management hook
 * Replaces the inconsistent loading slice pattern
 */

import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useMemo } from 'react'
import { createSelector } from '@reduxjs/toolkit'

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
  const selectQuizMeta = useMemo(() => createSelector(
    (s: RootState) => s.quiz.status,
    (s: RootState) => s.quiz.slug,
    (s: RootState) => s.quiz.quizType,
    (s: RootState) => s.quiz.questions.length,
    (status, slug, quizType, qLen) => ({
      isLoading: status === 'loading',
      isSubmitting: status === 'submitting',
      hasError: status === 'failed',
      isSuccess: status === 'succeeded',
      isNotFound: status === 'not-found',
      hasData: qLen > 0,
      slug,
      quizType,
    })
  ), [])

  return useSelector(selectQuizMeta)
}

export function useFlashcardState() {
  const selectFlashcardMeta = useMemo(() => createSelector(
    (s: RootState) => s.flashcard.status,
    (s: RootState) => s.flashcard.questions.length,
    (status, qLen) => ({
      isLoading: status === 'loading',
      isSubmitting: status === 'submitting',
      hasError: status === 'failed',
      isSuccess: status === 'succeeded',
      hasData: qLen > 0,
    })
  ), [])

  return useSelector(selectFlashcardMeta)
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
  const STALENESS_THRESHOLD = 5 * 60 * 1000 // 5 minutes
  const now = Date.now()

  const selectFreshness = useMemo(() => createSelector(
    (s: RootState) => s.quiz.lastUpdated,
    (s: RootState) => s.flashcard.lastUpdated,
    (quizLastUpdated, flashLastUpdated) => ({
      quiz: {
        isStale: quizLastUpdated ? (now - quizLastUpdated) > STALENESS_THRESHOLD : true,
        lastUpdated: quizLastUpdated,
        age: quizLastUpdated ? now - quizLastUpdated : null
      },
      flashcard: {
        isStale: flashLastUpdated ? (now - flashLastUpdated) > STALENESS_THRESHOLD : true,
        lastUpdated: flashLastUpdated,
        age: flashLastUpdated ? now - flashLastUpdated : null
      }
    })
  ), [now])

  return useSelector(selectFreshness)
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