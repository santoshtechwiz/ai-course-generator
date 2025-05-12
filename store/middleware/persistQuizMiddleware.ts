import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import { initQuiz, submitAnswer, nextQuestion, completeQuiz, resetQuiz, type QuizState } from "../slices/quizSlice"

// Create a listener middleware
const listenerMiddleware = createListenerMiddleware()

// Define a key for localStorage
const QUIZ_STATE_KEY = "quiz_state"

// Add a listener that will be called when any of the specified actions are dispatched
listenerMiddleware.startListening({
  matcher: isAnyOf(initQuiz, submitAnswer, nextQuestion, completeQuiz, resetQuiz),
  effect: (action, listenerApi) => {
    // Get the current state
    const state = listenerApi.getState() as { quiz: QuizState }

    // Don't persist if we're in a server environment
    if (typeof window === "undefined") return

    // Create a simplified version of the state to persist
    // Only include essential data to avoid storage bloat
    const persistedState = {
      quizId: state.quiz.quizId,
      slug: state.quiz.slug,
      quizType: state.quiz.quizType,
      currentQuestionIndex: state.quiz.currentQuestionIndex,
      answers: state.quiz.answers,
      isCompleted: state.quiz.isCompleted,
      score: state.quiz.score,
      completedAt: state.quiz.completedAt,
    }

    try {
      // Use requestIdleCallback if available for better performance
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          localStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(persistedState))
        })
      } else {
        // Fallback to setTimeout
        setTimeout(() => {
          localStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(persistedState))
        }, 0)
      }
    } catch (error) {
      console.error("Failed to persist quiz state:", error)
    }
  },
})

// Function to load persisted state
export const loadPersistedQuizState = (): Partial<QuizState> | undefined => {
  if (typeof window === "undefined") return undefined

  try {
    const persistedStateJSON = localStorage.getItem(QUIZ_STATE_KEY)
    if (!persistedStateJSON) return undefined

    return JSON.parse(persistedStateJSON)
  } catch (error) {
    console.error("Failed to load persisted quiz state:", error)
    return undefined
  }
}

// Function to clear persisted state
export const clearPersistedQuizState = (): void => {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(QUIZ_STATE_KEY)
  } catch (error) {
    console.error("Failed to clear persisted quiz state:", error)
  }
}

export default listenerMiddleware
