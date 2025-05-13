import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit"
import {
  initQuiz,
  submitAnswer,
  nextQuestion,
  completeQuiz,
  resetQuiz,
  type QuizState,
} from "../slices/quizSlice"
import { QUIZ_STORAGE_KEYS } from "@/lib/constants/quiz-constants"

const listenerMiddleware = createListenerMiddleware()
const QUIZ_STATE_KEY = QUIZ_STORAGE_KEYS.GLOBAL

listenerMiddleware.startListening({
  matcher: isAnyOf(initQuiz, submitAnswer, nextQuestion, completeQuiz, resetQuiz),
  effect: (action, listenerApi) => {
    const state = listenerApi.getState() as { quiz: QuizState }

    if (typeof window === "undefined") return

    if (state.quiz.isCompleted) {
      localStorage.removeItem(QUIZ_STATE_KEY)
      return
    }

    const persistedState = {
      quizId: state.quiz.quizId,
      slug: state.quiz.slug,
      quizType: state.quiz.quizType,
      currentQuestionIndex: state.quiz.currentQuestionIndex,
      answers: state.quiz.answers,
      isCompleted: state.quiz.isCompleted,
      score: state.quiz.score,
      completedAt: state.quiz.completedAt,
      questions: state.quiz.questions, // ✅ Include questions
    }

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

export const loadPersistedQuizState = (): Partial<QuizState> | undefined => {
  if (typeof window === "undefined") return undefined

  try {
    const json = localStorage.getItem(QUIZ_STATE_KEY)
    if (!json) return undefined
    return JSON.parse(json)
  } catch (error) {
    console.error("Failed to load persisted quiz state:", error)
    return undefined
  }
}

export const clearPersistedQuizState = (): void => {
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(QUIZ_STATE_KEY)
  } catch (error) {
    console.error("Failed to clear persisted quiz state:", error)
  }
}

export default listenerMiddleware
