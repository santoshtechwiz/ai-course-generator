// import type { Middleware } from "redux"
// import { completeQuiz, submitAnswer, resetQuiz, setIsAuthenticated, setForceShowResults } from "../slices/quizSlice"

// // Define a key for the persisted quiz state
// const PERSISTED_QUIZ_KEY = "persisted_quiz_state"

// // Create middleware to persist quiz state
// export const persistQuizMiddleware: Middleware = (store) => (next) => (action) => {
//   // Process the action first
//   const result = next(action)

//   // Get the current state
//   const state = store.getState()

//   // Check if we need to persist the state based on the action type
//   if (
//     action.type === completeQuiz.type ||
//     action.type === submitAnswer.type ||
//     action.type === setIsAuthenticated.type
//   ) {
//     try {
//       // Only persist if we have a valid quiz
//       if (state.quiz.quizId && state.quiz.slug) {
//         // Create a simplified version of the state to persist
//         const persistedState = {
//           quizId: state.quiz.quizId,
//           slug: state.quiz.slug,
//           quizType: state.quiz.quizType,
//           title: state.quiz.title,
//           currentQuestionIndex: state.quiz.currentQuestionIndex,
//           answers: state.quiz.answers,
//           score: state.quiz.score,
//           isCompleted: state.quiz.isCompleted,
//           completedAt: state.quiz.completedAt,
//           savedAt: Date.now(),
//         }

//         // Save to localStorage
//         localStorage.setItem(PERSISTED_QUIZ_KEY, JSON.stringify(persistedState))

//         // Also save to a slug-specific key for better retrieval
//         if (state.quiz.slug) {
//           localStorage.setItem(`quiz_state_${state.quiz.slug}`, JSON.stringify(persistedState))
//         }

//         console.log("Quiz state persisted after action:", action.type)
//       }
//     } catch (error) {
//       console.error("Failed to persist quiz state:", error)
//     }
//   }

//   // Clear persisted state on reset
//   if (action.type === resetQuiz.type) {
//     try {
//       localStorage.removeItem(PERSISTED_QUIZ_KEY)

//       // Also remove slug-specific state if available
//       if (state.quiz.slug) {
//         localStorage.removeItem(`quiz_state_${state.quiz.slug}`)
//       }

//       console.log("Persisted quiz state cleared")
//     } catch (error) {
//       console.error("Failed to clear persisted quiz state:", error)
//     }
//   }

//   // Handle authentication state change - if becoming authenticated and there's a pending redirect
//   if (action.type === setIsAuthenticated.type && action.payload === true && state.quiz.pendingAuthRedirect) {
//     // Force show results
//     store.dispatch(setForceShowResults(true))

//     // Try to restore state from storage
//     try {
//       const persistedStateJson =
//         localStorage.getItem(`quiz_state_${state.quiz.slug}`) || localStorage.getItem(PERSISTED_QUIZ_KEY)

//       if (persistedStateJson) {
//         console.log("Found persisted state after authentication")
//       }
//     } catch (error) {
//       console.error("Failed to check for persisted state:", error)
//     }
//   }

//   return result
// }
