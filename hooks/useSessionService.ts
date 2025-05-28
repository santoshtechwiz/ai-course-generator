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

    // Dispatch to Redux
    dispatch(setPendingQuiz({
      slug,
      quizData,
      currentState: {
        ...currentState,
        showResults
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
            showResults
          }
        }))
        sessionStorage.setItem('authRedirectPath', state.returnPath)
      } catch (error) {
        console.warn('Failed to save auth redirect state to sessionStorage:', error)
      }
    }
  }, [dispatch])

  const handleSignInWithState = useCallback((slug: string, showResults: boolean = false) => {
    dispatch(setPendingQuiz({
      slug,
      quizData: null,
      currentState: {
        showResults
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
