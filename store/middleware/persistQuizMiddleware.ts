import type { Middleware } from "@reduxjs/toolkit"

export const persistQuizMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action)

  // Save quiz state when completing a quiz
  if (action.type === "quiz/completeQuiz") {
    const state = store.getState().quiz
    if (typeof window !== "undefined" && state.slug) {
      try {
        localStorage.setItem(
          `quiz_state_${state.slug}`,
          JSON.stringify({
            quizId: state.quizId,
            slug: state.slug,
            quizResults: {
              score: state.score,
              answers: state.answers,
              totalQuestions: state.questions.length,
              correctAnswers: state.answers.filter((a) => a?.isCorrect).length,
            },
            completedAt: state.completedAt,
          }),
        )
      } catch (err) {
        console.error("Failed to save quiz state to localStorage:", err)
      }
    }
  }

  // Clear quiz state when resetting
  if (action.type === "quiz/resetQuiz") {
    const state = store.getState().quiz
    if (typeof window !== "undefined" && state.slug) {
      try {
        localStorage.removeItem(`quiz_state_${state.slug}`)
      } catch (err) {
        console.error("Failed to remove quiz state from localStorage:", err)
      }
    }
  }

  return result
}
