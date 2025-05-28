'use client'

import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/store'
import { rehydrateQuiz, resetPendingQuiz, setPendingQuiz } from '@/store/slices/quizSlice'

export type AuthRedirectState = {
  returnPath: string
  quizState: {
    slug: string
    quizData?: any
    currentState?: Record<string, any>
    showResults?: boolean
  }
}

export function useSessionService() {
  const dispatch = useDispatch<AppDispatch>()

  const saveAuthRedirectState = useCallback((state: AuthRedirectState) => {
    const { slug, quizData = null, currentState = {}, showResults = false } = state.quizState
    
    // Check if we have quiz results in Redux that should be preserved
    let quizResults = null;
    if (typeof window !== 'undefined' && showResults) {
      try {
        // Try to get results from session storage first
        const storedResults = sessionStorage.getItem(`quiz_results_${slug}`);
        if (storedResults) {
          quizResults = JSON.parse(storedResults);
        }
      } catch (e) {
        console.warn('Failed to retrieve stored quiz results:', e);
      }
    }

    // Dispatch to Redux
    dispatch(setPendingQuiz({
      slug,
      quizData,
      currentState: {
        ...currentState,
        showResults,
        results: quizResults // Include results when redirecting for authentication
      }
    }))

    // Store in sessionStorage if in browser
    if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem('pendingQuiz', JSON.stringify({
          slug,
          quizData,
          currentState: {
            ...currentState,
            showResults,
            results: quizResults // Include results in sessionStorage too
          }
        }))
        sessionStorage.setItem('authRedirectPath', state.returnPath)
      } catch (error) {
        console.warn('Failed to save auth redirect state to sessionStorage:', error)
      }
    }
  }, [dispatch])

  const handleSignInWithState = useCallback((slug: string, showResults: boolean = false) => {
    // Attempt to retrieve existing quiz data from session storage
    let existingData = null;
    let existingAnswers = null;
    
    if (typeof window !== 'undefined') {
      try {
        const storedQuiz = sessionStorage.getItem('pendingQuiz');
        if (storedQuiz) {
          const parsed = JSON.parse(storedQuiz);
          existingData = parsed.quizData;
          
          // Also try to get answers if available
          if (parsed.currentState?.answers) {
            existingAnswers = parsed.currentState.answers;
          }
        }
      } catch (e) {
        console.warn('Failed to retrieve existing quiz data:', e);
      }
    }

    dispatch(setPendingQuiz({
      slug,
      quizData: existingData, // Use existing data if available instead of null
      currentState: {
        showResults,
        // Also include answers if available to properly compute results
        answers: existingAnswers || {}
      }
    }))

    // Return a safe callback URL
    return `/dashboard/mcq/${slug}${showResults ? '/results' : ''}`
  }, [dispatch])

  // Restore from sessionStorage and dispatch to Redux if applicable
  const restoreAuthRedirectState = useCallback(() => {
    if (typeof window === 'undefined') return null

    try {
      const state = sessionStorage.getItem('pendingQuiz')
      if (state) {
        const parsed = JSON.parse(state)
        dispatch(rehydrateQuiz(parsed))
        dispatch(resetPendingQuiz())
        sessionStorage.removeItem('pendingQuiz') // Clear session storage after restoring
        sessionStorage.removeItem('authRedirectPath') // Clear redirect path
        return parsed
      }
    } catch (e) {
      console.warn('Failed to restore redirect state:', e)
    }

    return null
  }, [dispatch])

  return {
    saveAuthRedirectState,
    handleSignInWithState,
    restoreAuthRedirectState,
  }

}
