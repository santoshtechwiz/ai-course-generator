import type { Middleware } from "redux"
import type { RootState } from "@/store"
import { completeQuiz } from "@/store/slices/quizSlice"

// This middleware handles persisting quiz results to the server when needed
export const persistQuizMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  // First, let the action go through to update the state
  const result = next(action)

  // If the action is completeQuiz, we may need to persist the results
  if (action.type === completeQuiz.type) {
    const state = store.getState()
    const { quiz, auth } = state

    // Only persist if the user is authenticated
    if (auth.isAuthenticated && quiz.quizId) {
      // Get the quiz results from the state
      const { answers, quizId, quizType, quizTitle } = quiz

      // Send the results to the server
      fetch("/api/quiz/save-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizId,
          quizType,
          quizTitle,
          answers,
        }),
      }).catch((error) => {
        console.error("Failed to save quiz results:", error)
      })
    }
  }

  return result
}
