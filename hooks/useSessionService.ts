"use client"

import { useCallback } from "react"
import { useDispatch, useSelector } from "react-redux"
import type { AppDispatch } from "@/store"
import { 
  hydrateQuiz,
  resetPendingQuiz, 
  setPendingQuiz,
  setQuizResults
} from "@/store/slices/quizSlice"
import { selectPendingQuiz } from "@/store/slices/quizSlice"

export type QuizState = {
  slug: string
  quizData?: any
  currentState?: {
    answers?: Record<string, any>
    results?: any
    showResults?: boolean
    [key: string]: any
  }
}

export type AuthRedirectState = {
  returnPath: string
  quizState: QuizState
}

export function useSessionService() {
  const dispatch = useDispatch<AppDispatch>()
  
  // Get pending quiz from Redux state
  const pendingQuiz = useSelector(selectPendingQuiz)

  const saveAuthRedirectState = useCallback(
    (state: AuthRedirectState) => {
      try {
        const { returnPath } = state
        const quizState = state.quizState || {}
        const { slug = "", quizData = null, currentState = {} } = quizState

        // Validate required data
        if (!slug || typeof slug !== "string") {
          console.warn("saveAuthRedirectState: Invalid slug provided")
          return
        }

        // Create a pendingQuiz with proper structure
        const pendingQuizData = {
          slug,
          quizData,
          currentState: {
            ...currentState,
            showResults: currentState.showResults || false,
            // Store results if available
            results: currentState.results || null,
            // Store answers if available
            answers: currentState.answers || {},
          },
        }

        // Save to Redux store
        dispatch(setPendingQuiz(pendingQuizData))

        // For results pages, explicitly save the results to ensure they're available immediately
        if (currentState.showResults && currentState.results) {
          dispatch(setQuizResults(currentState.results))
        }

        // Save redirect URL for NextAuth to use
        if (typeof window !== "undefined") {
          // Store the callback URL to ensure proper redirection after sign-in
          sessionStorage.setItem("callbackUrl", returnPath)
        }
      } catch (error) {
        console.error("Failed to save auth redirect state:", error)
      }
    },
    [dispatch],
  )

  const restoreAuthRedirectState = useCallback(() => {
    try {
      // Get from Redux state
      if (pendingQuiz?.slug) {
        console.log("Restoring auth redirect state:", pendingQuiz)
        
        // Apply the stored quiz state
        dispatch(hydrateQuiz(pendingQuiz))
        
        // Explicitly set results if they were stored
        if (pendingQuiz.currentState?.results && pendingQuiz.currentState.showResults) {
          console.log("Setting quiz results from pendingQuiz:", pendingQuiz.currentState.results)
          dispatch(setQuizResults(pendingQuiz.currentState.results))
        }
        
        return pendingQuiz
      }
      
      return null
    } catch (e) {
      console.error("Failed to restore redirect state:", e)
      return null
    }
  }, [dispatch, pendingQuiz])

  const clearAuthState = useCallback(() => {
    try {
      dispatch(resetPendingQuiz())
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("callbackUrl")
      }
    } catch (error) {
      console.warn("Failed to clear auth state:", error)
    }
  }, [dispatch])

  return {
    saveAuthRedirectState,
    restoreAuthRedirectState,
    clearAuthState,
  }
}
