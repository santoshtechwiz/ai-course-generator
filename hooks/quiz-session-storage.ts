export interface SavedQuizState {
  quizId: string
  slug: string
  type: string
  answers: any[]
  score: number
  totalTime: number
  redirectPath?: string
  timestamp: number
}

const STORAGE_KEY = "quiz_state"
const EXPIRY_TIME = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

export function saveQuizState(state: Omit<SavedQuizState, "timestamp">): void {
  if (typeof window === "undefined") return

  try {
    const stateWithTimestamp = {
      ...state,
      timestamp: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithTimestamp))
    console.log("Quiz state saved to local storage")
  } catch (error) {
    console.error("Error saving quiz state:", error)
  }
}

export function getSavedQuizState(): { quizState: any; answers: any[] } | null {
  if (typeof window === "undefined") return null

  try {
    const stateJson = localStorage.getItem(STORAGE_KEY)
    if (!stateJson) return null

    const state = JSON.parse(stateJson) as SavedQuizState

    // Check if state has expired
    if (Date.now() - state.timestamp > EXPIRY_TIME) {
      clearSavedQuizState()
      return null
    }

    // Return in the expected format
    return {
      quizState: {
        quizId: state.quizId,
        quizType: state.type,
        quizSlug: state.slug,
        currentQuestion: 0, // Default to first question
        totalQuestions: state.answers.length,
        startTime: Date.now() - state.totalTime * 1000, // Approximate start time
        isCompleted: true, // If we have a saved state, it was completed
      },
      answers: state.answers || [],
    }
  } catch (error) {
    console.error("Error retrieving quiz state:", error)
    return null
  }
}

export function hasSavedQuizState(): boolean {
  return getSavedQuizState() !== null
}

export function clearSavedQuizState(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(STORAGE_KEY)
    console.log("Quiz state cleared from session storage")
  } catch (error) {
    console.error("Error clearing quiz state:", error)
  }
}
