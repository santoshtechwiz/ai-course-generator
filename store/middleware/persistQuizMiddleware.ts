import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import type { TypedStartListening } from "@reduxjs/toolkit"
import type { RootState } from "@/store"

const STORAGE_KEY = "quiz_state"

// Create the middleware instance
const persistQuizMiddleware = createListenerMiddleware()

// Add listeners for specific actions
const startAppListening = persistQuizMiddleware.startListening as TypedStartListening<RootState>

// Create explicit action matchers for better test compatibility
const actionsThatPersist = [
  "quiz/fetchQuiz/fulfilled",
  "quiz/setCurrentQuestion", 
  "quiz/setUserAnswer"
];

// Save state on these actions
startAppListening({
  matcher: isAnyOf(
    (action) => actionsThatPersist.includes(action.type)
  ),
  effect: (action, listenerApi) => {
    try {
      const state = listenerApi.getState().quiz
      
      // Extract only what we need to save
      const stateToSave = {
        currentQuestion: state.currentQuestion,
        userAnswers: state.userAnswers,
        currentQuizId: state.quizData?.id,
        quizData: state.quizData,
        timeRemaining: state.timeRemaining,
        timerActive: state.timerActive,
      }
      
      // Save to localStorage directly in tests or for SSR
      if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
      } else {
        // Use requestIdleCallback in production for better performance
        try {
          window.requestIdleCallback(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
          })
        } catch (e) {
          // Fallback if requestIdleCallback is not available
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
        }
      }
    } catch (error) {
      console.error('Error saving quiz state:', error)
    }
  },
})

// Clear state on quiz completion
startAppListening({
  predicate: (action) => action.type === "quiz/submitQuiz/fulfilled",
  effect: () => {
    try {
      // Remove directly in tests or for SSR
      if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') {
        localStorage.removeItem(STORAGE_KEY)
      } else {
        // Use requestIdleCallback in production
        try {
          window.requestIdleCallback(() => {
            localStorage.removeItem(STORAGE_KEY)
          })
        } catch (e) {
          // Fallback if requestIdleCallback is not available
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error('Error removing quiz state:', error)
    }
  },
})

// Helper functions
export const loadPersistedQuizState = () => {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY)
    return savedState ? JSON.parse(savedState) : null
  } catch {
    return null
  }
}

export const clearPersistedQuizState = () => {
  localStorage.removeItem(STORAGE_KEY)
}

export const hasAuthRedirectState = () => {
  return Boolean(localStorage.getItem(STORAGE_KEY))
}

export default persistQuizMiddleware
