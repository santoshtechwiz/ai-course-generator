import type { Middleware } from "@reduxjs/toolkit"

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

const persistQuizMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action)

  if (action.type === "quiz/setCurrentQuestion" || action.type === "quiz/markAnswer") {
    debounceSaveState(store.getState().quiz, store.getState().quiz.currentQuizSlug)
  }

  if (action.type === "quiz/markQuizCompleted") {
    saveQuizResults(store.getState().quiz.currentQuizSlug, action.payload)
    clearQuizState(store.getState().quiz.currentQuizSlug)
  }

  if (action.type === "quiz/authenticationRequired") {
    debounceSaveAuthState(store.getState().quiz, action.payload)
  }

  return result
}

const debounceSaveState = (quizState: any, quizSlug: string) => {
  if (debounceTimerId) {
    clearTimeout(debounceTimerId)
  }

  debounceTimerId = setTimeout(() => {
    saveQuizState(quizState, quizSlug)
  }, DEBOUNCE_INTERVAL)
}

const debounceSaveAuthState = (quizState: any, authData: any) => {
  if (authDebounceTimerId) {
    clearTimeout(authDebounceTimerId)
  }

  authDebounceTimerId = setTimeout(() => {
    saveAuthRedirect(quizState, authData)
  }, AUTH_DEBOUNCE_INTERVAL)
}

const saveQuizState = (quizState: any, quizSlug: string) => {
  try {
    const stateToSave = {
      currentQuestion: quizState.currentQuestion,
      userAnswers: quizState.userAnswers,
      quizData: quizState.quizData,
      timestamp: Date.now(),
      version: VERSION,
    }

    window.sessionStorage.setItem(`${QUIZ_STATE_KEY_PREFIX}${quizSlug}`, JSON.stringify(stateToSave))
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
    window.sessionStorage.setItem(`${QUIZ_RESULTS_KEY_PREFIX}${quizSlug}`, JSON.stringify(resultsToSave))
  } catch (error) {
    console.error("Error saving quiz results:", error)
  }
}

const saveAuthRedirect = (quizState: any, authData: any) => {
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

    window.sessionStorage.setItem(AUTH_REDIRECT_KEY, JSON.stringify(authState))
  } catch (error) {
    console.error("Error saving auth redirect state:", error)
  }
}

export const loadPersistedQuizState = async (quizSlug: string): Promise<any | null> => {
  try {
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
    window.sessionStorage.removeItem(`${QUIZ_STATE_KEY_PREFIX}${quizSlug}`)
    return null
  }
}

export const loadPersistedQuizResults = async (quizSlug: string): Promise<any | null> => {
  try {
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
    window.sessionStorage.removeItem(`${QUIZ_RESULTS_KEY_PREFIX}${quizSlug}`)
    return null
  }
}

export const checkStoredAuthRedirectState = async (store: any) => {
  try {
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
    window.sessionStorage.removeItem(AUTH_REDIRECT_KEY)
  }
}

const clearQuizState = (quizSlug: string) => {
  window.sessionStorage.removeItem(`${QUIZ_STATE_KEY_PREFIX}${quizSlug}`)
}

export const clearPersistedQuizState = async (quizSlug?: string) => {
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

  if (visibilityChangeListener) {
    window.removeEventListener("visibilitychange", visibilityChangeListener)
    visibilityChangeListener = null
  }
}

// Force save on visibility change
if (typeof document !== "undefined" && typeof window !== "undefined") {
  visibilityChangeListener = () => {
    if (document.visibilityState === "hidden") {
      // Force save pending changes
      if (debounceTimerId) {
        clearTimeout(debounceTimerId)
        // @ts-ignore
        saveQuizState(window.__store__.getState().quiz, window.__store__.getState().quiz.currentQuizSlug)
      }
    }
  }

  window.addEventListener("visibilitychange", visibilityChangeListener)
}

export default {
  middleware: persistQuizMiddleware,
}
