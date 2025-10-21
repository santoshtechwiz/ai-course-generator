// Simple type-safe storage utilities without external dependencies
import { createListenerMiddleware } from '@reduxjs/toolkit'
import { RootState } from '@/store'

const STORAGE_CONFIG = {
  debounceMs: 500,
  prefix: 'courseai_',
  persistKeys: {
    user: 'user_profile',
    settings: 'ui_settings'
  }
} as const

const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem(STORAGE_CONFIG.prefix + key) || 
             sessionStorage.getItem(STORAGE_CONFIG.prefix + key)
    } catch (error) {
      console.warn(`Storage read error for key "${key}":`, error)
      return null
    }
  },

  setItem: async (key: string, value: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false
    
    const fullKey = STORAGE_CONFIG.prefix + key
    try {
      localStorage.setItem(fullKey, value)
      sessionStorage.setItem(fullKey, value)
      return true
    } catch (error) {
      console.error(`Storage write error for key "${key}":`, error)
      return false
    }
  }
}

export function hydrateFromStorage<T = any>(key: string): T | null {
  const raw = safeStorage.getItem(key)
  if (!raw) return null
  
  try {
    return JSON.parse(raw)
  } catch (error) {
    console.warn('Deserialization failed:', error)
    return null
  }
}

async function persistToStorage(key: string, data: any): Promise<void> {
  try {
    const serialized = JSON.stringify(data)
    await safeStorage.setItem(key, serialized)
  } catch (error) {
    console.error('Failed to persist:', error)
  }
}

const persistenceListenerMiddleware = createListenerMiddleware()

const storageUtils = {
  clear: () => {
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(STORAGE_CONFIG.prefix)) {
          localStorage.removeItem(key)
        }
      })
    }
  }
}


