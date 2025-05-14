import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import {
  resetQuizState,
  setCurrentQuestion,
  setUserAnswer,
  startTimer,
  pauseTimer,
  resumeTimer,
  markQuizCompleted,
  fetchQuiz,
  submitQuiz,
} from "../slices/quizSlice"
import type { RootState } from "@/store"

const listenerMiddleware = createListenerMiddleware()
const QUIZ_STATE_KEY = "quiz_state"

/**
 * Middleware that persists quiz state to localStorage when specific actions are dispatched
 */
listenerMiddleware.startListening({
  matcher: isAnyOf(
    resetQuizState,
    setCurrentQuestion,
    setUserAnswer,
    startTimer,
    pauseTimer,
    resumeTimer,
    markQuizCompleted,
    fetchQuiz.fulfilled,
    submitQuiz.fulfilled,
    // Add rejected actions to handle auth errors
    fetchQuiz.rejected,
    submitQuiz.rejected,
  ),
  effect: (action, listenerApi) => {
    const state = listenerApi.getState() as RootState

    // Skip if running on server
    if (typeof window === "undefined") return

    // If quiz is completed or no current quiz, remove from localStorage
    if (state.quiz.isCompleted || !state.quiz.currentQuizId) {
      try {
        localStorage.removeItem(QUIZ_STATE_KEY)
      } catch (error) {
        console.error("Failed to remove completed quiz state:", error)
      }
      return
    }

    // Special handling for authentication errors
    if (
      action.type.endsWith("/rejected") &&
      action.payload &&
      (action.payload === "Unauthorized" || action.payload.includes("Session"))
    ) {
      // Make sure to persist state before redirecting to login
      try {
        const persistedState = {
          quizData: state.quiz.quizData
            ? {
                id: state.quiz.quizData.id,
                title: state.quiz.quizData.title,
                type: state.quiz.quizData.type,
                slug: state.quiz.quizData.slug,
              }
            : null,
          currentQuestion: state.quiz.currentQuestion,
          userAnswers: state.quiz.userAnswers,
          currentQuizId: state.quiz.currentQuizId,
          timeRemaining: state.quiz.timeRemaining,
          timerActive: false, // Always pause timer during auth flow
          authRedirect: true, // Flag to indicate auth redirect
        }

        localStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(persistedState))
      } catch (error) {
        console.error("Failed to persist quiz state during auth error:", error)
      }
      return
    }

    // Extract only the necessary state to persist
    const persistedState = {
      quizData: state.quiz.quizData
        ? {
            id: state.quiz.quizData.id,
            title: state.quiz.quizData.title,
            type: state.quiz.quizData.type,
            slug: state.quiz.quizData.slug,
          }
        : null,
      currentQuestion: state.quiz.currentQuestion,
      userAnswers: state.quiz.userAnswers,
      currentQuizId: state.quiz.currentQuizId,
      timeRemaining: state.quiz.timeRemaining,
      timerActive: state.quiz.timerActive,
    }

    // Save to localStorage using requestIdleCallback when available
    try {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          localStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(persistedState))
        })
      } else {
        setTimeout(() => {
          localStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(persistedState))
        }, 0)
      }
    } catch (error) {
      console.error("Failed to persist quiz state:", error)
    }
  },
})

/**
 * Loads persisted quiz state from localStorage
 * @returns The persisted quiz state or undefined if not found
 */
export const loadPersistedQuizState = () => {
  if (typeof window === "undefined") return undefined

  try {
    const json = localStorage.getItem(QUIZ_STATE_KEY)
    if (!json) return undefined

    const state = JSON.parse(json)

    // If this was an auth redirect, clear the flag
    if (state.authRedirect) {
      state.authRedirect = false
      // Save the updated state back to localStorage
      localStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(state))
    }

    return state
  } catch (error) {
    console.error("Failed to load persisted quiz state:", error)
    return undefined
  }
}

/**
 * Clears persisted quiz state from localStorage
 */
export const clearPersistedQuizState = () => {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(QUIZ_STATE_KEY)
  } catch (error) {
    console.error("Failed to clear persisted quiz state:", error)
  }
}

/**
 * Checks if there is persisted quiz state from an auth redirect
 * @returns True if there is persisted state from an auth redirect
 */
export const hasAuthRedirectState = () => {
  if (typeof window === "undefined") return false

  try {
    const json = localStorage.getItem(QUIZ_STATE_KEY)
    if (!json) return false

    const state = JSON.parse(json)
    return state.authRedirect === true
  } catch (error) {
    console.error("Failed to check for auth redirect state:", error)
    return false
  }
}

export default listenerMiddleware
