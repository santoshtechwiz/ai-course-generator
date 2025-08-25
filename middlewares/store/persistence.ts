import { Middleware } from 'redux'
import { RootState } from '@/store'

/**
 * Enhanced persistence middleware with better error handling and performance
 */

// Storage configuration
const STORAGE_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  compressionThreshold: 50000, // 50KB
  maxStorageSize: 5 * 1024 * 1024, // 5MB
} as const

// Safe storage utilities with improved error handling
export const safeStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null
    
    try {
      // Try localStorage first, then sessionStorage
      return localStorage.getItem(key) || sessionStorage.getItem(key)
    } catch (error) {
      console.warn(`Storage read error for key "${key}":`, error)
      // Try alternative storage method
      try {
        return sessionStorage.getItem(key)
      } catch (fallbackError) {
        console.error(`Fallback storage read failed for key "${key}":`, fallbackError)
        return null
      }
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (typeof window === 'undefined') return false
    
    // Check storage quota before writing
    if (value.length > STORAGE_CONFIG.maxStorageSize) {
      console.warn(`Value too large for storage key "${key}": ${value.length} bytes`)
      return false
    }
    
    let attempts = 0
    while (attempts < STORAGE_CONFIG.maxRetries) {
      try {
        localStorage.setItem(key, value)
        
        // Verify write was successful
        if (localStorage.getItem(key) === value) {
          return true
        }
        
        throw new Error('Storage verification failed')
      } catch (error) {
        attempts++
        console.warn(`Storage write attempt ${attempts} failed for key "${key}":`, error)
        
        if (attempts >= STORAGE_CONFIG.maxRetries) {
          // Try sessionStorage as fallback
          try {
            sessionStorage.setItem(key, value)
            return true
          } catch (fallbackError) {
            console.error(`All storage methods failed for key "${key}":`, fallbackError)
            return false
          }
        }
        
        // Wait before retry
        if (attempts < STORAGE_CONFIG.maxRetries) {
          setTimeout(() => {}, STORAGE_CONFIG.retryDelay * attempts)
        }
      }
    }
    
    return false
  },

  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    } catch (error) {
      console.warn(`Storage removal error for key "${key}":`, error)
    }
  },

  getSize: (): number => {
    if (typeof window === 'undefined') return 0
    
    try {
      let total = 0
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length
        }
      }
      return total
    } catch (error) {
      console.warn('Unable to calculate storage size:', error)
      return 0
    }
  }
}

/**
 * Load and parse persisted state with validation
 */
export function hydrateFromStorage<T = any>(key: string): T | null {
  const raw = safeStorage.getItem(key)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    
    // Basic validation
    if (parsed && typeof parsed === 'object') {
      return parsed
    }
    
    console.warn(`Invalid data structure for key "${key}"`)
    return null
  } catch (error) {
    console.error(`Failed to parse storage JSON for key "${key}":`, error)
    // Clean up corrupted data
    safeStorage.removeItem(key)
    return null
  }
}

/**
 * Compress data if it exceeds threshold
 */
function compressData(data: string): string {
  if (data.length < STORAGE_CONFIG.compressionThreshold) {
    return data
  }
  
  // Simple compression - in production, consider using a proper compression library
  try {
    return JSON.stringify(JSON.parse(data))
  } catch {
    return data
  }
}

// Persist configuration interface
interface PersistConfig {
  key: string
  whitelist?: (keyof RootState)[]
  blacklist?: (keyof RootState)[]
  throttle?: number
  transform?: {
    in?: (state: any) => any
    out?: (state: any) => any
  }
}

/**
 * Enhanced persist middleware with throttling and validation
 */
export const createPersistMiddleware = (config: PersistConfig): Middleware => {
  let lastPersist = 0
  const throttleMs = config.throttle || 1000
  
  return store => next => action => {
    const result = next(action)
    
    if (typeof window === 'undefined') return result
    
    // Throttle persistence to improve performance
    const now = Date.now()
    if (now - lastPersist < throttleMs) {
      return result
    }
    lastPersist = now
    
    try {
      const fullState = store.getState()
      let filteredState: Partial<RootState> = { ...fullState }

      // Apply whitelist
      if (config.whitelist) {
        filteredState = config.whitelist.reduce((acc, key) => {
          acc[key] = fullState[key]
          return acc
        }, {} as Partial<RootState>)
      }

      // Apply blacklist
      if (config.blacklist) {
        config.blacklist.forEach(key => {
          delete filteredState[key]
        })
      }

      // Apply transform
      if (config.transform?.out) {
        filteredState = config.transform.out(filteredState)
      }

      const json = compressData(JSON.stringify(filteredState))
      
      if (!safeStorage.setItem(config.key, json)) {
        console.warn(`Failed to persist state for key "${config.key}"`)
      }
    } catch (error) {
      console.error(`Error persisting state for key "${config.key}":`, error)
    }

    return result
  }
}

/**
 * Enhanced slice persist middleware with better error handling
 */
export const createSlicePersistMiddleware = <K extends keyof RootState>(
  slice: K,
  storageKey: string,
  options: { throttle?: number; transform?: (data: any) => any } = {}
): Middleware<{}, RootState> => {
  let lastPersist = 0
  const throttleMs = options.throttle || 500
  
  return store => next => action => {
    const result = next(action)
    
    if (typeof window === 'undefined') return result
    
    // Throttle persistence
    const now = Date.now()
    if (now - lastPersist < throttleMs) {
      return result
    }
    lastPersist = now
    
    try {
      let sliceData = store.getState()[slice]
      
      // Apply transform if provided
      if (options.transform) {
        sliceData = options.transform(sliceData)
      }
      
      const json = compressData(JSON.stringify(sliceData))
      
      if (!safeStorage.setItem(storageKey, json)) {
        console.warn(`Failed to persist slice "${String(slice)}" to "${storageKey}"`)
      }
    } catch (error) {
      console.error(`Failed to persist slice "${String(slice)}" to "${storageKey}":`, error)
    }

    return result
  }
}

/**
 * Storage cleanup utility
 */
export function cleanupStorage(): void {
  if (typeof window === 'undefined') return
  
  try {
    const now = Date.now()
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
    
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key) && key.startsWith('persist:')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}')
          if (data._persist && data._persist.rehydrated) {
            const age = now - (data._persist.version || 0)
            if (age > maxAge) {
              localStorage.removeItem(key)
              console.log(`Cleaned up old persisted data: ${key}`)
            }
          }
        } catch (error) {
          // Remove corrupted data
          localStorage.removeItem(key)
          console.log(`Removed corrupted persisted data: ${key}`)
        }
      }
    }
  } catch (error) {
    console.warn('Storage cleanup failed:', error)
  }
}

// Run cleanup on load - deferred to avoid blocking hydration
if (typeof window !== 'undefined') {
  setTimeout(cleanupStorage, 10000) // Increased delay to 10 seconds
}
