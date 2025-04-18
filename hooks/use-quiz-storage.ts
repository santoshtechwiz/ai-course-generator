// Utility functions for quiz state management

// Types
export interface QuizState {
  currentQuestionIndex: number
  answers: any[]
  [key: string]: any
}

export interface QuizResult {
  answers: any[]
  score: number
  [key: string]: any
}

// Save quiz state to localStorage
export const saveQuizState = (quizId: string, quizType: string, state: QuizState): void => {
  try {
    if (typeof window !== "undefined") {
      const key = `quiz_state_${quizType}_${quizId}`
      localStorage.setItem(
        key,
        JSON.stringify({
          ...state,
          timestamp: Date.now(), // Add timestamp for expiry checking
        }),
      )
    }
  } catch (error) {
    console.error("Error saving quiz state:", error)
  }
}

// Load quiz state from localStorage
export const loadQuizState = (quizId: string, quizType: string): QuizState | null => {
  try {
    if (typeof window !== "undefined") {
      const key = `quiz_state_${quizType}_${quizId}`
      const state = localStorage.getItem(key)
      return state ? JSON.parse(state) : null
    }
  } catch (error) {
    console.error("Error loading quiz state:", error)
  }
  return null
}

// Save quiz result to localStorage
export const saveQuizResult = (quizId: string, quizType: string, slug: string, result: QuizResult): void => {
  try {
    if (typeof window !== "undefined") {
      const key = `quiz_result_${quizType}_${quizId}`
      localStorage.setItem(
        key,
        JSON.stringify({
          ...result,
          slug,
          timestamp: Date.now(),
        }),
      )
    }
  } catch (error) {
    console.error("Error saving quiz result:", error)
  }
}

// Load quiz result from localStorage
export const loadQuizResult = (quizId: string, quizType: string): QuizResult | null => {
  try {
    if (typeof window !== "undefined") {
      const key = `quiz_result_${quizType}_${quizId}`
      const result = localStorage.getItem(key)
      return result ? JSON.parse(result) : null
    }
  } catch (error) {
    console.error("Error loading quiz result:", error)
  }
  return null
}

// Clear quiz data by ID
export const clearQuizDataById = (quizId: string, quizType: string): void => {
  try {
    if (typeof window !== "undefined") {
      const stateKey = `quiz_state_${quizType}_${quizId}`
      const resultKey = `quiz_result_${quizType}_${quizId}`
      localStorage.removeItem(stateKey)
      localStorage.removeItem(resultKey)
    }
  } catch (error) {
    console.error("Error clearing quiz data:", error)
  }
}

// Clear all quiz data
export const clearAllQuizData = (): void => {
  try {
    if (typeof window !== "undefined") {
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith("quiz_state_") || key.startsWith("quiz_result_")) {
          localStorage.removeItem(key)
        }
      })
    }
  } catch (error) {
    console.error("Error clearing all quiz data:", error)
  }
}
