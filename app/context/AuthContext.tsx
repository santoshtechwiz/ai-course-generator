"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { QuizState } from "@/lib/quiz-storage-service"
import { QuizResult } from "../types/quiz-types"


interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: any | null
  saveQuizState: (state: QuizState) => void
  loadQuizState: (quizId: string, quizType: string) => QuizState | null
  saveQuizResult: (quizId: string, quizType: string, slug: string, result: QuizResult) => void
  loadQuizResult: (quizId: string, quizType: string) => QuizResult | null
  clearSavedQuizState: () => void
  hasSavedQuizState: () => boolean
  getSavedQuizState: () => QuizState | null
  clearQuizDataById: (quizId: string, quizType: string) => void
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  saveQuizState: () => {},
  loadQuizState: () => null,
  saveQuizResult: () => {},
  loadQuizResult: () => null,
  clearSavedQuizState: () => {},
  hasSavedQuizState: () => false,
  getSavedQuizState: () => null,
  clearQuizDataById: () => {},
})

interface AuthProviderProps {
  children: ReactNode
}

// Helper function to save data with expiration
const saveToStorage = (key: string, data: any, expirationHours = 24) => {
  try {
    if (typeof window === "undefined") return

    const item = {
      value: data,
      expiry: Date.now() + expirationHours * 60 * 60 * 1000,
    }
    localStorage.setItem(key, JSON.stringify(item))
  } catch (error) {
    console.error(`Error saving to storage with key ${key}:`, error)
  }
}

// Helper function to get data with expiration check
const getFromStorage = (key: string) => {
  try {
    if (typeof window === "undefined") return null

    const itemStr = localStorage.getItem(key)
    if (!itemStr) return null

    const item = JSON.parse(itemStr)

    // Check if the item has expired
    if (item.expiry && Date.now() > item.expiry) {
      localStorage.removeItem(key)
      return null
    }

    return item.value
  } catch (error) {
    console.error(`Error getting from storage with key ${key}:`, error)
    return null
  }
}

// Handle auth flow transition
export function handleAuthFlowTransition() {
  if (typeof window === "undefined") return

  try {
    // Check if we're in an auth flow
    const inAuthFlow = sessionStorage.getItem("inAuthFlow") === "true"

    if (inAuthFlow) {
      // Get the pending quiz data
      const pendingQuizDataStr = sessionStorage.getItem("pendingQuizData")
      if (pendingQuizDataStr) {
        const pendingQuizData = JSON.parse(pendingQuizDataStr)

        // Check if we have valid quiz data
        if (pendingQuizData?.quizId && pendingQuizData?.quizType) {
          // Get any saved guest results for this quiz
          const guestResultKey = `guestQuizResults_${pendingQuizData.quizId}`
          const guestResultStr = localStorage.getItem(guestResultKey)

          if (guestResultStr) {
            // Mark these results for transfer to the user account
            sessionStorage.setItem("transferGuestResults", guestResultStr)
          }
        }
      }
    }

    // Clear the auth flow markers
    sessionStorage.removeItem("inAuthFlow")
    sessionStorage.removeItem("pendingQuizData")
    localStorage.removeItem("preserveGuestResults")
  } catch (error) {
    console.error("Error handling auth flow transition:", error)
  }
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  const isAuthenticated = status === "authenticated"
  const isLoading = status === "loading" || !isMounted

  // Save quiz state to localStorage with expiration
  const saveQuizState = useCallback((state: QuizState) => {
    try {
      if (typeof window === "undefined") return

      const key = `quiz_state_${state.type}_${state.quizId}`
      saveToStorage(
        key,
        {
          ...state,
          timestamp: Date.now(),
        },
        24,
      ) // 24 hour expiration

      // Also save to a common key for auth flow
      saveToStorage(
        "savedQuizState",
        {
          ...state,
          timestamp: Date.now(),
        },
        1,
      ) // 1 hour expiration for auth flow state
    } catch (error) {
      console.error("Error saving quiz state:", error)
    }
  }, [])

  // Load quiz state from localStorage
  const loadQuizState = useCallback((quizId: string, quizType: string): QuizState | null => {
    try {
      if (typeof window === "undefined") return null

      const key = `quiz_state_${quizType}_${quizId}`
      return getFromStorage(key)
    } catch (error) {
      console.error("Error loading quiz state:", error)
      return null
    }
  }, [])

  // Save quiz result to localStorage
  const saveQuizResult = useCallback((quizId: string, quizType: string, slug: string, result: QuizResult): void => {
    try {
      if (typeof window === "undefined") return

      const key = `quiz_result_${quizType}_${quizId}`
      saveToStorage(
        key,
        {
          ...result,
          slug,
          timestamp: Date.now(),
        },
        72,
      ) // 72 hour expiration
    } catch (error) {
      console.error("Error saving quiz result:", error)
    }
  }, [])

  // Load quiz result from localStorage
  const loadQuizResult = useCallback((quizId: string, quizType: string): QuizResult | null => {
    try {
      if (typeof window === "undefined") return null

      const key = `quiz_result_${quizType}_${quizId}`
      return getFromStorage(key)
    } catch (error) {
      console.error("Error loading quiz result:", error)
      return null
    }
  }, [])

  // Check if there's a saved quiz state
  const hasSavedQuizState = useCallback((): boolean => {
    try {
      if (typeof window === "undefined") return false
      return !!getFromStorage("savedQuizState")
    } catch (error) {
      console.error("Error checking for saved quiz state:", error)
      return false
    }
  }, [])

  // Get saved quiz state
  const getSavedQuizState = useCallback((): QuizState | null => {
    try {
      if (typeof window === "undefined") return null
      return getFromStorage("savedQuizState")
    } catch (error) {
      console.error("Error getting saved quiz state:", error)
      return null
    }
  }, [])

  // Clear saved quiz state
  const clearSavedQuizState = useCallback((): void => {
    try {
      if (typeof window === "undefined") return
      localStorage.removeItem("savedQuizState")
    } catch (error) {
      console.error("Error clearing saved quiz state:", error)
    }
  }, [])

  // Clear quiz data by ID
  const clearQuizDataById = useCallback((quizId: string, quizType: string): void => {
    try {
      if (typeof window === "undefined") return

      const stateKey = `quiz_state_${quizType}_${quizId}`
      const resultKey = `quiz_result_${quizType}_${quizId}`
      localStorage.removeItem(stateKey)
      localStorage.removeItem(resultKey)
    } catch (error) {
      console.error("Error clearing quiz data:", error)
    }
  }, [])

  // Handle post sign-in redirect
  const handlePostSignInRedirect = useCallback(() => {
    if (typeof window === "undefined") return

    try {
      const pendingResultKey = "pending_quiz_result"
      const pendingResult = localStorage.getItem(pendingResultKey)

      if (pendingResult) {
        const result = JSON.parse(pendingResult)
        localStorage.removeItem(pendingResultKey)

        // Redirect to results page with the quiz result
        router.push(`/quiz/${result.slug}/results`)
      }
    } catch (error) {
      console.error("Error handling post-sign-in redirect:", error)
    }
  }, [router])

  // Check for pending redirects when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      handlePostSignInRedirect()
    }
  }, [isAuthenticated, handlePostSignInRedirect])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user: session?.user || null,
        saveQuizState,
        loadQuizState,
        saveQuizResult,
        loadQuizResult,
        clearSavedQuizState,
        hasSavedQuizState,
        getSavedQuizState,
        clearQuizDataById,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
