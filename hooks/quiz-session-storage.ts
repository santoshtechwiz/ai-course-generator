export interface QuizState {
  quizId: string
  quizType: string
  slug: string
  currentQuestion: number
  totalQuestions: number
  startTime: number
  isCompleted: boolean
  redirectPath?: string
}

export interface QuizAnswers {
  [key: string]: any
}

export interface SavedQuizState {
  quizState: QuizState
  answers: QuizAnswers
}

// Add this function to fix callback URLs in the quiz session storage

export function fixCallbackUrl(url: string): string {
  if (!url) return "/dashboard"

  // If the URL contains /quiz/, replace it with /dashboard/
  if (url.includes("/quiz/")) {
    return url.replace("/quiz/", "/dashboard/")
  }

  // Ensure the URL starts with /dashboard if it's a relative path
  if (url.startsWith("/") && !url.startsWith("/dashboard")) {
    // But don't duplicate /dashboard if it's already there
    return `/dashboard${url}`
  }

  return url
}

// Add a function to get and set quiz answers
export function saveQuizAnswers(quizId: string, answers: any[]): void {
  try {
    if (typeof window === "undefined") return

    const storageKey = `quiz_answers_${quizId}`
    localStorage.setItem(storageKey, JSON.stringify(answers))
    console.log(`Saved ${answers.length} answers for quiz ${quizId}`)
  } catch (error) {
    console.error("Error saving quiz answers:", error)
  }
}

export function getQuizAnswers(quizId: string): any[] | null {
  try {
    if (typeof window === "undefined") return null

    const storageKey = `quiz_answers_${quizId}`
    const savedAnswers = localStorage.getItem(storageKey)
    if (!savedAnswers) return null

    return JSON.parse(savedAnswers)
  } catch (error) {
    console.error("Error getting quiz answers:", error)
    return null
  }
}

// Modify the saveQuizState function to better handle answers
export function saveQuizState(state: QuizState, answers: QuizAnswers = {}): void {
  try {
    if (typeof window === "undefined") return

    // Ensure we have a redirectPath
    if (!state.redirectPath) {
      state.redirectPath = `/dashboard/${state.quizType}/${state.slug}`
    }

    // If the quiz is completed, add that to the state
    if (state.isCompleted) {
      // Add completed flag to the redirect path
      if (!state.redirectPath.includes("completed=true")) {
        state.redirectPath += `${state.redirectPath.includes("?") ? "&" : "?"}completed=true`
      }
    }

    const savedState: SavedQuizState = {
      quizState: state,
      answers,
    }

    sessionStorage.setItem("savedQuizState", JSON.stringify(savedState))

    // Also save answers separately for better persistence
    if (state.quizId && Object.keys(answers).length > 0) {
      saveQuizAnswers(state.quizId, Object.values(answers))
    }

    // Also save to localStorage for better persistence
    if (state.isCompleted) {
      localStorage.setItem(
        `quiz_result_${state.quizId}`,
        JSON.stringify({
          quizId: state.quizId,
          quizType: state.quizType,
          slug: state.slug,
          score: 0, // This will be updated later
          answers: Object.values(answers),
          totalTime: 0, // This will be updated later
          timestamp: Date.now(),
          isCompleted: true,
          redirectPath: state.redirectPath,
        }),
      )
    }
  } catch (error) {
    console.error("Error saving quiz state:", error)
  }
}

// Get saved quiz state from session storage
export function getSavedQuizState(): SavedQuizState | null {
  try {
    if (typeof window === "undefined") return null

    const savedState = sessionStorage.getItem("savedQuizState")
    if (!savedState) return null

    return JSON.parse(savedState)
  } catch (error) {
    console.error("Error getting saved quiz state:", error)
    return null
  }
}

// Clear saved quiz state from session storage
export function clearSavedQuizState(): void {
  try {
    if (typeof window === "undefined") return

    sessionStorage.removeItem("savedQuizState")
  } catch (error) {
    console.error("Error clearing saved quiz state:", error)
  }
}

// Add a function to get quiz result by ID
export function getQuizResultById(quizId: string): any | null {
  try {
    if (typeof window === "undefined") return null

    const resultStr = localStorage.getItem(`quiz_result_${quizId}`)
    if (!resultStr) return null

    return JSON.parse(resultStr)
  } catch (error) {
    console.error("Error getting quiz result:", error)
    return null
  }
}

// Add a function to clear all quiz data
export function clearAllQuizData(): void {
  try {
    if (typeof window === "undefined") return

    // Clear session storage
    sessionStorage.removeItem("savedQuizState")
    sessionStorage.removeItem("wasSignedIn")

    // Clear all quiz results from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("quiz_result_") || key.startsWith("quiz_state_")) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    console.error("Error clearing all quiz data:", error)
  }
}
