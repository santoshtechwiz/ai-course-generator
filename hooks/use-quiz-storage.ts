// Utility functions for quiz state management

// Types
export interface QuizState {
  currentQuestionIndex: number
  answers: any[]
  timeSpent?: number[]
  [key: string]: any
}

export interface QuizResult {
  answers: any[]
  score: number
  totalTime?: number
  [key: string]: any
}

// Constants
const STORAGE_EXPIRY_TIME = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

// Save quiz state to localStorage with improved error handling
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

// Load quiz state from localStorage with expiry check
export const loadQuizState = (quizId: string, quizType: string): QuizState | null => {
  try {
    if (typeof window !== "undefined") {
      const key = `quiz_state_${quizType}_${quizId}`
      const stateJson = localStorage.getItem(key)

      if (!stateJson) return null

      const state = JSON.parse(stateJson)

      // Check if state has expired
      if (state.timestamp && Date.now() - state.timestamp > STORAGE_EXPIRY_TIME) {
        localStorage.removeItem(key)
        return null
      }

      return state
    }
  } catch (error) {
    console.error("Error loading quiz state:", error)
    // If there's an error, clear the potentially corrupted state
    if (typeof window !== "undefined") {
      const key = `quiz_state_${quizType}_${quizId}`
      localStorage.removeItem(key)
    }
  }
  return null
}

// Save quiz result to localStorage with improved error handling
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

// Load quiz result from localStorage with expiry check
export const loadQuizResult = (quizId: string, quizType: string): QuizResult | null => {
  try {
    if (typeof window !== "undefined") {
      const key = `quiz_result_${quizType}_${quizId}`
      const resultJson = localStorage.getItem(key)

      if (!resultJson) return null

      const result = JSON.parse(resultJson)

      // Check if result has expired
      if (result.timestamp && Date.now() - result.timestamp > STORAGE_EXPIRY_TIME) {
        localStorage.removeItem(key)
        return null
      }

      return result
    }
  } catch (error) {
    console.error("Error loading quiz result:", error)
    // If there's an error, clear the potentially corrupted result
    if (typeof window !== "undefined") {
      const key = `quiz_result_${quizType}_${quizId}`
      localStorage.removeItem(key)
    }
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

// Get all saved quiz results
export const getAllQuizResults = (): Record<string, QuizResult> => {
  try {
    if (typeof window !== "undefined") {
      const results: Record<string, QuizResult> = {}
      const keys = Object.keys(localStorage)

      keys.forEach((key) => {
        if (key.startsWith("quiz_result_")) {
          const resultJson = localStorage.getItem(key)
          if (resultJson) {
            try {
              const result = JSON.parse(resultJson)
              // Check if result has expired
              if (!result.timestamp || Date.now() - result.timestamp <= STORAGE_EXPIRY_TIME) {
                results[key] = result
              } else {
                // Remove expired result
                localStorage.removeItem(key)
              }
            } catch (e) {
              // Remove corrupted result
              localStorage.removeItem(key)
            }
          }
        }
      })

      return results
    }
  } catch (error) {
    console.error("Error getting all quiz results:", error)
  }
  return {}
}
