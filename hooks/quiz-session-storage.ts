/**
 * Utility functions for storing quiz state in session storage
 * to preserve it during authentication flow
 */

// Keys for session storage
const QUIZ_STATE_KEY = "quiz_state"
const QUIZ_ANSWERS_KEY = "quiz_answers"
const QUIZ_REDIRECT_KEY = "quiz_redirect"

// Types
interface QuizState {
  quizId: string
  quizType: string
  quizSlug: string
  currentQuestion: number
  totalQuestions: number
  startTime: number
  isCompleted: boolean
}

// Save quiz state before redirecting to auth
export function saveQuizStateBeforeAuth(quizState: QuizState, answers: any[], redirectPath: string): void {
  try {
    // Store quiz state
    sessionStorage.setItem(QUIZ_STATE_KEY, JSON.stringify(quizState))

    // Store answers
    sessionStorage.setItem(QUIZ_ANSWERS_KEY, JSON.stringify(answers))

    // Store redirect path
    sessionStorage.setItem(QUIZ_REDIRECT_KEY, redirectPath)
  } catch (error) {
    console.error("Error saving quiz state to session storage:", error)
  }
}

// Get saved quiz state after auth
export function getSavedQuizState(): {
  quizState: QuizState | null
  answers: any[] | null
  redirectPath: string | null
} {
  try {
    // Get quiz state
    const quizStateStr = sessionStorage.getItem(QUIZ_STATE_KEY)
    const quizState = quizStateStr ? JSON.parse(quizStateStr) : null

    // Get answers
    const answersStr = sessionStorage.getItem(QUIZ_ANSWERS_KEY)
    const answers = answersStr ? JSON.parse(answersStr) : null

    // Get redirect path
    const redirectPath = sessionStorage.getItem(QUIZ_REDIRECT_KEY)

    return { quizState, answers, redirectPath }
  } catch (error) {
    console.error("Error retrieving quiz state from session storage:", error)
    return { quizState: null, answers: null, redirectPath: null }
  }
}

// Clear saved quiz state
export function clearSavedQuizState(): void {
  try {
    sessionStorage.removeItem(QUIZ_STATE_KEY)
    sessionStorage.removeItem(QUIZ_ANSWERS_KEY)
    sessionStorage.removeItem(QUIZ_REDIRECT_KEY)
  } catch (error) {
    console.error("Error clearing quiz state from session storage:", error)
  }
}

// Check if there's a saved quiz state
export function hasSavedQuizState(): boolean {
  try {
    return !!sessionStorage.getItem(QUIZ_STATE_KEY)
  } catch (error) {
    return false
  }
}
