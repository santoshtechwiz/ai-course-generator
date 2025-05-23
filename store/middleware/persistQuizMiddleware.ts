import { createListenerMiddleware } from "@reduxjs/toolkit"
import type { TypedStartListening } from "@reduxjs/toolkit"
import type { RootState } from "@/store"
import { saveAuthRedirectState, restoreFromAuthRedirect } from "../slices/quizSlice"

// Memory storage fallback for SSR
const memoryStorage = new Map<string, string>()

// Safe storage that works in both client and server environments
const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(key)
    }
    return memoryStorage.get(key) || null
  },
  setItem: (key: string, value: string): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(key, value)
    } else {
      memoryStorage.set(key, value)
    }
  },
  removeItem: (key: string): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(key)
    } else {
      memoryStorage.delete(key)
    }
  }
}

const persistQuizMiddleware = createListenerMiddleware()
const startAppListening = persistQuizMiddleware.startListening as TypedStartListening<RootState>

// Listen for auth redirect state changes
startAppListening({
  actionCreator: saveAuthRedirectState,
  effect: (action, listenerApi) => {
    safeStorage.setItem('quiz_auth_redirect', JSON.stringify(action.payload))
  }
})

// Function to check for stored auth redirect state
export const checkStoredAuthRedirectState = (store: any) => {
  // Only run on client side
  if (typeof window === 'undefined') return

  const stored = safeStorage.getItem('quiz_auth_redirect')
  if (stored) {
    try {
      const state = JSON.parse(stored)
      store.dispatch(restoreFromAuthRedirect())
      safeStorage.removeItem('quiz_auth_redirect')
    } catch (error) {
      console.error('Error restoring quiz state:', error)
    }
  }
}

export default persistQuizMiddleware
