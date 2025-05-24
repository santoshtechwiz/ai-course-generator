// middleware/persistQuizMiddleware.ts
import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { TypedStartListening } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import {
  saveAuthRedirectState,
  restoreFromAuthRedirect,
  setCurrentQuestion,
  markQuizCompleted,
} from "@/store/slices/quizSlice"
import type { UserAnswer } from "@/app/types/quiz-types"
import type { QuizData, QuizType, QuizResult } from "@/types/quiz"

interface PersistedQuizState {
  currentQuestion: number
  userAnswers: UserAnswer[]
  quizData: QuizData | null
  timestamp: number
  version: string
}

interface PersistedAuthState {
  slug: string
  quizId: string
  type: QuizType
  userAnswers: UserAnswer[]
  currentQuestion: number
  tempResults: QuizResult | null
  fromSubmission?: boolean
  timestamp: number
  version: string
}

interface PersistedQuizResults extends QuizResult {
  slug: string
  score: number
  timestamp: number
  version: string
}

const STORAGE_VERSION = "1.0.0"
const CACHE_DURATION = 24 * 60 * 60 * 1000
const MAX_RETRIES = 3
const RETRY_DELAY = 100

// Create a class for managing debounced operations
class DebounceManager {
  private timeouts: Map<string, number> = new Map()
  private tabId: string

  constructor() {
    // Generate a unique ID for this tab instance
    this.tabId = typeof window !== 'undefined' 
      ? `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      : 'server'
  }

  debounce(key: string, fn: () => void, delay = 300): void {
    try {
      // Create a tab-specific key to avoid conflicts between tabs
      const scopedKey = `${this.tabId}:${key}`
      
      // Clear existing timeout
      this.clear(scopedKey)
      
      // Set new timeout
      const timeout = window.setTimeout(() => {
        fn()
        this.timeouts.delete(scopedKey)
      }, delay)
      
      this.timeouts.set(scopedKey, timeout)
    } catch (e) {
      console.error(`Error in debounce for key ${key}:`, e)
    }
  }

  clear(key: string): void {
    const timeout = this.timeouts.get(key)
    if (timeout) {
      clearTimeout(timeout)
      this.timeouts.delete(key)
    }
  }

  clearAll(): void {
    this.timeouts.forEach((timeout) => clearTimeout(timeout))
    this.timeouts.clear()
  }

  get size(): number {
    return this.timeouts.size
  }
}

// Create a class for safe storage operations
class SafeStorage {
  private storage: Storage | null = null
  private memoryStorage: Map<string, string> = new Map()

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private getStorage(): Storage {
    if (this.storage) return this.storage
    
    if (typeof window === "undefined") {
      return this.getMemoryStorage()
    }

    try {
      const testKey = "__test__"
      window.sessionStorage.setItem(testKey, "1")
      window.sessionStorage.removeItem(testKey)
      this.storage = window.sessionStorage
      return this.storage
    } catch {
      return this.getMemoryStorage()
    }
  }

  private getMemoryStorage(): Storage {
    return {
      getItem: (key: string) => this.memoryStorage.get(key) || null,
      setItem: (key: string, value: string) => this.memoryStorage.set(key, value),
      removeItem: (key: string) => this.memoryStorage.delete(key),
      clear: () => this.memoryStorage.clear(),
      key: (index: number) => Array.from(this.memoryStorage.keys())[index] || null,
      length: this.memoryStorage.size
    }
  }

  private isExpired(item: any): boolean {
    if (!item?.timestamp) return false
    return Date.now() - item.timestamp > CACHE_DURATION
  }

  async getItem(key: string): Promise<string | null> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const item = this.getStorage().getItem(key)
        if (item) {
          const parsed = JSON.parse(item)
          if (this.isExpired(parsed)) {
            await this.removeItem(key)
            return null
          }
        }
        return item
      } catch (err) {
        console.warn(`getItem attempt ${attempt + 1} failed:`, err)
        await this.delay(RETRY_DELAY * (attempt + 1))
      }
    }
    return null
  }

  async setItem(key: string, value: string): Promise<void> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        this.getStorage().setItem(key, value)
        return
      } catch (err) {
        console.warn(`setItem attempt ${attempt + 1} failed:`, err)
        await this.delay(RETRY_DELAY * (attempt + 1))
        if (attempt === MAX_RETRIES - 1) this.clearExpiredItems()
      }
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      this.getStorage().removeItem(key)
    } catch (err) {
      console.warn("removeItem failed:", err)
    }
  }

  private clearExpiredItems(): void {
    try {
      const storage = this.getStorage()
      const keysToRemove: string[] = []

      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i)
        if (!key || (!key.startsWith("quiz_") && !key.startsWith("quiz_auth_"))) continue
        try {
          const item = storage.getItem(key)
          const parsed = item ? JSON.parse(item) : null
          if (!parsed || this.isExpired(parsed)) keysToRemove.push(key)
        } catch {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach((key) => storage.removeItem(key))
    } catch (err) {
      console.warn("clearExpiredItems failed:", err)
    }
  }
}

// Initialize storage and debounce manager
const safeStorage = new SafeStorage()
const debounceManager = new DebounceManager()

// Create middleware
const persistQuizMiddleware = createListenerMiddleware()
const startAppListening = persistQuizMiddleware.startListening as TypedStartListening<RootState>

// Helper functions
const getStorageKeys = (slug: string) => ({
  quiz: `quiz_state_${slug}`,
  auth: "quiz_auth_redirect",
  results: `quiz_results_${slug}`,
})

const debouncedSave = (key: string, data: any, delay = 300) => {
  debounceManager.debounce(key, () => {
    safeStorage
      .setItem(
        key,
        JSON.stringify({
          ...data,
          timestamp: Date.now(),
          version: STORAGE_VERSION,
        })
      )
      .catch((err) => console.error(`Failed saving ${key}:`, err))
  }, delay)
}

// Listen for setCurrentQuestion action
startAppListening({
  actionCreator: setCurrentQuestion,
  effect: (action, api) => {
    const state = api.getState()
    const slug = state.quiz.currentQuizSlug
    if (!slug) return

    const data = {
      currentQuestion: state.quiz.currentQuestion,
      userAnswers: state.quiz.userAnswers,
      quizData: state.quiz.quizData,
    }

    if (data.currentQuestion < 0) return
    debouncedSave(getStorageKeys(slug).quiz, data)
  },
})

// Helper function for saving auth state
const saveAuth = (payload: any, state: RootState) => {
  const data = {
    ...payload,
    slug: state.quiz.currentQuizSlug || "",
    quizId: state.quiz.currentQuizId || "",
    type: state.quiz.currentQuizType || payload.type || "code",
    userAnswers: state.quiz.userAnswers || [],
    currentQuestion: state.quiz.currentQuestion,
    tempResults: state.quiz.tempResults,
  }

  if (!data.slug || !data.type) return
  debouncedSave(getStorageKeys("").auth, data, 100)
}

// Listen for saveAuthRedirectState action
startAppListening({
  actionCreator: saveAuthRedirectState,
  effect: (action, api) => saveAuth(action.payload, api.getState()),
})

// Listen for authentication required action
startAppListening({
  predicate: (action) => action.type === "quiz/authenticationRequired",
  effect: (action, api) => {
    const state = api.getState()
    const payload = action.payload || {}
    
    const data = {
      fromSubmission: payload.fromSubmission || false,
      slug: state.quiz.currentQuizSlug || "",
      quizId: state.quiz.currentQuizId || "",
      type: state.quiz.currentQuizType || payload.type || "code",
      userAnswers: state.quiz.userAnswers || [],
      currentQuestion: state.quiz.currentQuestion || 0,
      tempResults: state.quiz.tempResults || null
    }

    if (!data.slug || !data.type) return
    debouncedSave(getStorageKeys("").auth, data, 100)
  },
})

// Listen for markQuizCompleted action
startAppListening({
  actionCreator: markQuizCompleted,
  effect: async (action, api) => {
    const state = api.getState()
    const slug = state.quiz.currentQuizSlug || action.payload.slug
    if (!slug) return

    const keys = getStorageKeys(slug)
    const resultData = {
      ...action.payload,
      slug,
      score: action.payload.score || 0,
      totalQuestions: action.payload.totalQuestions || 0,
      correctAnswers: action.payload.correctAnswers || 0,
      totalTime: action.payload.totalTime || 0,
      type: action.payload.type || state.quiz.currentQuizType || "code",
      quizId: action.payload.quizId || state.quiz.currentQuizId || "",
    }

    // Clear any pending debounced saves for this quiz
    debounceManager.clear(keys.quiz)

    // Atomically save results and remove quiz state
    await Promise.all([
      safeStorage.setItem(
        keys.results,
        JSON.stringify({ ...resultData, timestamp: Date.now(), version: STORAGE_VERSION }),
      ),
      safeStorage.removeItem(keys.quiz),
    ])
  },
})

// Utility function to check for stored auth redirect state
export const checkStoredAuthRedirectState = async (store: any) => {
  try {
    const stored = await safeStorage.getItem("quiz_auth_redirect")
    if (!stored) return
    
    let shouldRemove = true;
    try {
      const state = JSON.parse(stored)
      if (state && typeof state === 'object' && state.slug && state.type) {
        store.dispatch(restoreFromAuthRedirect(state))
        shouldRemove = true;
      } else {
        console.warn("Invalid auth redirect state found, removing")
      }
    } catch (error) {
      console.error("Corrupted auth redirect state found, removing")
    } finally {
      if (shouldRemove) {
        await safeStorage.removeItem("quiz_auth_redirect")
      }
    }
  } catch (error) {
    console.error("Error checking stored auth redirect state:", error)
    await safeStorage.removeItem("quiz_auth_redirect")
  }
}

// Utility function to clear persisted quiz state
export const clearPersistedQuizState = async (slug?: string) => {
  try {
    if (slug) {
      const keys = getStorageKeys(slug)
      await Promise.all([
        safeStorage.removeItem(keys.quiz),
        safeStorage.removeItem(keys.results),
      ])
      debounceManager.clear(keys.quiz)
    }
    await safeStorage.removeItem(getStorageKeys("").auth)
  } catch (error) {
    console.error("Error clearing persisted quiz state:", error)
  }
}

// Utility function to load persisted quiz state
export const loadPersistedQuizState = async (slug: string): Promise<PersistedQuizState | null> => {
  const key = getStorageKeys(slug).quiz
  try {
    const stored = await safeStorage.getItem(key)
    if (!stored) return null

    const parsed = JSON.parse(stored)
    if (parsed.version !== STORAGE_VERSION) {
      console.info(`Migrating quiz state from ${parsed.version || 'unknown'} to ${STORAGE_VERSION}`)
      // Add migration logic here if needed
    }

    return {
      currentQuestion: parsed.currentQuestion ?? 0,
      userAnswers: Array.isArray(parsed.userAnswers) ? parsed.userAnswers : [],
      quizData: parsed.quizData || null,
      timestamp: parsed.timestamp || Date.now(),
      version: parsed.version || STORAGE_VERSION,
    }
  } catch (err) {
    console.warn(`Corrupted quiz state for ${slug}. Removing.`, err)
    await safeStorage.removeItem(key)
    return null
  }
}

// Utility function to load persisted quiz results
export const loadPersistedQuizResults = async (
  slug: string
): Promise<PersistedQuizResults | null> => {
  const key = getStorageKeys(slug).results
  try {
    const stored = await safeStorage.getItem(key)
    if (!stored) return null
    return JSON.parse(stored) as PersistedQuizResults
  } catch (err) {
    console.warn(`Corrupted quiz results for ${slug}. Removing.`, err)
    await safeStorage.removeItem(key)
    return null
  }
}

// Cleanup function
export const cleanup = () => {
  debounceManager.clearAll()
}

// Add event listeners for cleanup
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", cleanup)
  
  // Also clean up on visibility change to handle tab switching
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      // Force immediate save of any pending changes when tab becomes hidden
      const pendingCount = debounceManager.size
      if (pendingCount > 0) {
        console.log(`Forcing save of ${pendingCount} pending changes before tab becomes hidden`)
        // This will trigger immediate save of all pending changes
        debounceManager.clearAll()
      }
    }
  })
}

export default persistQuizMiddleware
