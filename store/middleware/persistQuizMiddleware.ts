import type { Middleware, AnyAction } from "@reduxjs/toolkit"

// Define proper types
interface QuizState {
  currentQuestion: number
  currentQuizSlug: string
  currentQuizId: string
  currentQuizType: "code" | "multiple-choice" | "essay"
  userAnswers: any[]
  quizData: any
  tempResults: any
  [key: string]: any
}

interface RootState {
  quiz: QuizState
}

interface QuizCompletedAction extends AnyAction {
  type: "quiz/markQuizCompleted"
  payload: {
    quizId: string
    slug: string
    score: number
    totalQuestions: number
    correctAnswers: number
    totalTime: number
    type: "code" | "multiple-choice" | "essay"
    results: any
  }
}

interface AuthRequiredAction extends AnyAction {
  type: "quiz/authenticationRequired"
  payload: {
    fromSubmission?: boolean
    type?: "code" | "multiple-choice" | "essay"
  }
}

const QUIZ_STATE_KEY_PREFIX = "quiz_state_"
const QUIZ_RESULTS_KEY_PREFIX = "quiz_results_"
const AUTH_REDIRECT_KEY = "quiz_auth_redirect"
const DEBOUNCE_INTERVAL = 300
const AUTH_DEBOUNCE_INTERVAL = 100
const DATA_EXPIRY_HOURS = 24
const VERSION = "1.0.0"

let debounceTimerId: NodeJS.Timeout | null = null
let authDebounceTimerId: NodeJS.Timeout | null = null
let visibilityChangeListener: (() => void) | null = null
let currentStore: any = null

const persistQuizMiddleware: Middleware<{}, RootState> = (store) => {
  // Store reference for visibility change handler
  currentStore = store

  return (next) => (action: AnyAction) => {
    const result = next(action)

    if (action.type === "quiz/setCurrentQuestion" || action.type === "quiz/markAnswer") {
      const state = store.getState()
      debounceSaveState(state.quiz, state.quiz.currentQuizSlug)
    }

    if (action.type === "quiz/markQuizCompleted") {
      const state = store.getState()
      const completedAction = action as QuizCompletedAction
      saveQuizResults(state.quiz.currentQuizSlug, completedAction.payload)
      clearQuizState(state.quiz.currentQuizSlug)
    }

    if (action.type === "quiz/authenticationRequired") {
      const state = store.getState()
      const authAction = action as AuthRequiredAction
      debounceSaveAuthState(state.quiz, authAction.payload)
    }

    return result
  }
}

const debounceSaveState = (quizState: QuizState, quizSlug: string) => {
  if (debounceTimerId) {
    clearTimeout(debounceTimerId)
  }

  debounceTimerId = setTimeout(() => {
    saveQuizState(quizState, quizSlug)
  }, DEBOUNCE_INTERVAL)
}

const debounceSaveAuthState = (quizState: QuizState, authData: any) => {
  if (authDebounceTimerId) {
    clearTimeout(authDebounceTimerId)
  }

  authDebounceTimerId = setTimeout(() => {
    saveAuthRedirect(quizState, authData)
  }, AUTH_DEBOUNCE_INTERVAL)
}

const saveQuizState = (quizState: QuizState, quizSlug: string) => {
  try {
    const stateToSave = {
      currentQuestion: quizState.currentQuestion,
      userAnswers: quizState.userAnswers,
      quizData: quizState.quizData,
      timestamp: Date.now(),
      version: VERSION,
    }

    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(`${QUIZ_STATE_KEY_PREFIX}${quizSlug}`, JSON.stringify(stateToSave))
    }
  } catch (error) {
    console.error("Error saving quiz state:", error)
  }
}

const saveQuizResults = (quizSlug: string, results: any) => {
  try {
    const resultsToSave = {
      ...results,
      timestamp: Date.now(),
      version: VERSION,
    }

    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(`${QUIZ_RESULTS_KEY_PREFIX}${quizSlug}`, JSON.stringify(resultsToSave))
    }
  } catch (error) {
    console.error("Error saving quiz results:", error)
  }
}

const saveAuthRedirect = (quizState: QuizState, authData: any) => {
  try {
    const authState = {
      slug: quizState.currentQuizSlug,
      type: quizState.currentQuizType,
      currentQuestion: quizState.currentQuestion,
      userAnswers: quizState.userAnswers,
      tempResults: quizState.tempResults,
      quizId: quizState.currentQuizId,
      fromSubmission: authData.fromSubmission,
      timestamp: Date.now(),
      version: VERSION,
    }

    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(AUTH_REDIRECT_KEY, JSON.stringify(authState))
    }
  } catch (error) {
    console.error("Error saving auth redirect state:", error)
  }
}

const forceSavePendingChanges = () => {
  if (debounceTimerId && currentStore) {
    clearTimeout(debounceTimerId)
    debounceTimerId = null

    const state = currentStore.getState()
    saveQuizState(state.quiz, state.quiz.currentQuizSlug)
  }
}

export const loadPersistedQuizState = async (quizSlug: string): Promise<any | null> => {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) {
      return null
    }

    const serializedState = window.sessionStorage.getItem(`${QUIZ_STATE_KEY_PREFIX}${quizSlug}`)

    if (!serializedState) {
      return null
    }

    let state = JSON.parse(serializedState)

    // Validate version and migrate if needed
    if (!state.version) {
      state = {
        ...state,
        version: VERSION,
      }
    }

    // Check for expiry
    const now = Date.now()
    const expiry = DATA_EXPIRY_HOURS * 60 * 60 * 1000
    if (now - state.timestamp > expiry) {
      window.sessionStorage.removeItem(`${QUIZ_STATE_KEY_PREFIX}${quizSlug}`)
      return null
    }

    // Basic validation
    if (typeof state.currentQuestion !== "number") {
      state.currentQuestion = 0
    }

    if (!Array.isArray(state.userAnswers)) {
      state.userAnswers = []
    }

    return state
  } catch (error) {
    console.error("Error loading quiz state:", error)
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.removeItem(`${QUIZ_STATE_KEY_PREFIX}${quizSlug}`)
    }
    return null
  }
}

export const loadPersistedQuizResults = async (quizSlug: string): Promise<any | null> => {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) {
      return null
    }

    const serializedResults = window.sessionStorage.getItem(`${QUIZ_RESULTS_KEY_PREFIX}${quizSlug}`)

    if (!serializedResults) {
      return null
    }

    const results = JSON.parse(serializedResults)

    if (!results.version) {
      return null
    }

    return results
  } catch (error) {
    console.error("Error loading quiz results:", error)
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.removeItem(`${QUIZ_RESULTS_KEY_PREFIX}${quizSlug}`)
    }
    return null
  }
}

export const checkStoredAuthRedirectState = async (store: any) => {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) {
      return
    }

    const serializedState = window.sessionStorage.getItem(AUTH_REDIRECT_KEY)

    if (!serializedState) {
      return
    }

    const state = JSON.parse(serializedState)

    if (!state || !state.slug || !state.type || typeof state.currentQuestion !== "number") {
      window.sessionStorage.removeItem(AUTH_REDIRECT_KEY)
      return
    }

    store.dispatch({
      type: "quiz/restoreFromAuthRedirect",
      payload: {
        slug: state.slug,
        type: state.type,
        currentQuestion: state.currentQuestion,
        userAnswers: state.userAnswers,
        tempResults: state.tempResults,
        quizId: state.quizId,
      },
    })

    window.sessionStorage.removeItem(AUTH_REDIRECT_KEY)
  } catch (error) {
    console.error("Error checking auth redirect state:", error)
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.removeItem(AUTH_REDIRECT_KEY)
    }
  }
}

const clearQuizState = (quizSlug: string) => {
  if (typeof window !== "undefined" && window.sessionStorage) {
    window.sessionStorage.removeItem(`${QUIZ_STATE_KEY_PREFIX}${quizSlug}`)
  }
}

export const clearPersistedQuizState = async (quizSlug?: string) => {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return
  }

  if (quizSlug) {
    window.sessionStorage.removeItem(`${QUIZ_STATE_KEY_PREFIX}${quizSlug}`)
    window.sessionStorage.removeItem(`${QUIZ_RESULTS_KEY_PREFIX}${quizSlug}`)
  }
  window.sessionStorage.removeItem(AUTH_REDIRECT_KEY)
}

export const cleanup = () => {
  if (debounceTimerId) {
    clearTimeout(debounceTimerId)
    debounceTimerId = null
  }

  if (authDebounceTimerId) {
    clearTimeout(authDebounceTimerId)
    authDebounceTimerId = null
  }

  if (visibilityChangeListener && typeof window !== "undefined") {
    window.removeEventListener("visibilitychange", visibilityChangeListener)
    visibilityChangeListener = null
  }
}

// Setup visibility change handler
if (typeof document !== "undefined" && typeof window !== "undefined") {
  visibilityChangeListener = () => {
    if (document.visibilityState === "hidden") {
      forceSavePendingChanges()
    }
  }

  window.addEventListener("visibilitychange", visibilityChangeListener)
}

export default {
  middleware: persistQuizMiddleware,
}
