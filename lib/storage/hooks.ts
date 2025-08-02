/**
 * Unified Storage Hooks
 * 
 * React hooks that provide a consistent interface for working with persistent state
 * across localStorage and sessionStorage with type safety and SSR support.
 * 
 * @author AI Learning Platform
 * @version 3.0.0
 */

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { storage, StorageOptions } from "./unified-storage"

// ============================================================================
// TYPES
// ============================================================================

export interface UsePersistentStateOptions extends StorageOptions {
  /** Whether to sync state across tabs/windows */
  syncAcrossTabs?: boolean
  /** Debounce delay for storage writes (ms) */
  debounceMs?: number
}

export interface UseStorageOptions {
  /** Default value if storage is empty */
  defaultValue?: any
  /** Storage type */
  storageType?: 'localStorage' | 'sessionStorage'
  /** Whether to encrypt the data */
  encrypt?: boolean
  /** Custom serialization */
  serialize?: (value: any) => string
  /** Custom deserialization */
  deserialize?: (value: string) => any
}

// ============================================================================
// UNIFIED PERSISTENT STATE HOOK
// ============================================================================

/**
 * Hook for persistent state that works with the unified storage service
 * 
 * @param key Storage key
 * @param initialValue Initial value
 * @param options Storage and sync options
 * @returns [state, setState, isLoading, error]
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
  options: UsePersistentStateOptions = {}
): [T, (value: T | ((prev: T) => T)) => void, boolean, string | null] {
  const {
    storage: storageType = 'localStorage',
    encrypt = false,
    sanitize = true,
    syncAcrossTabs = true,
    debounceMs = 300,
    ...storageOptions
  } = options

  const [state, setState] = useState<T>(initialValue)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isInitialized = useRef(false)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Initialize state from storage
  useEffect(() => {
    if (isInitialized.current) return

    try {
      const stored = storage.getItem<T>(key, {
        storage: storageType,
        encrypt,
        ...storageOptions
      })

      if (stored !== null) {
        setState(stored)
      }
      
      setError(null)
    } catch (err) {
      console.error(`Failed to load persistent state for key "${key}":`, err)
      setError(err instanceof Error ? err.message : 'Failed to load state')
    } finally {
      setIsLoading(false)
      isInitialized.current = true
    }
  }, [key, storageType, encrypt])

  // Debounced storage update
  const updateStorage = useCallback((newValue: T) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      try {
        const success = storage.setItem(key, newValue, {
          storage: storageType,
          encrypt,
          sanitize,
          ...storageOptions
        })

        if (!success) {
          setError('Failed to save to storage')
        } else {
          setError(null)
        }
      } catch (err) {
        console.error(`Failed to save persistent state for key "${key}":`, err)
        setError(err instanceof Error ? err.message : 'Failed to save state')
      }
    }, debounceMs)
  }, [key, storageType, encrypt, sanitize, debounceMs, storageOptions])

  // State setter with storage update
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setState(prevState => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prevState) : value
      
      // Update storage
      if (isInitialized.current) {
        updateStorage(newValue)
      }
      
      return newValue
    })
  }, [updateStorage])

  // Cross-tab synchronization
  useEffect(() => {
    if (!syncAcrossTabs || typeof window === 'undefined') return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== key || !e.newValue) return

      try {
        // Parse the new value
        let newValue: T
        
        if (encrypt) {
          // If encrypted, use the storage service to decrypt
          newValue = storage.getItem<T>(key, { storage: storageType, encrypt }) ?? initialValue
        } else {
          // Parse directly
          const parsed = JSON.parse(e.newValue)
          newValue = parsed.value ?? parsed
        }

        setState(newValue)
        setError(null)
      } catch (err) {
        console.error(`Failed to sync storage change for key "${key}":`, err)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, storageType, encrypt, syncAcrossTabs, initialValue])

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  return [state, setValue, isLoading, error]
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for temporary state (sessionStorage only)
 */
export function useTemporaryState<T>(
  key: string,
  initialValue: T,
  options: Omit<UsePersistentStateOptions, 'storage'> = {}
): [T, (value: T | ((prev: T) => T)) => void, boolean, string | null] {
  return usePersistentState(key, initialValue, {
    ...options,
    storage: 'sessionStorage',
    syncAcrossTabs: false // sessionStorage doesn't sync across tabs
  })
}

/**
 * Hook for secure state (encrypted localStorage)
 */
export function useSecureState<T>(
  key: string,
  initialValue: T,
  options: Omit<UsePersistentStateOptions, 'encrypt'> = {}
): [T, (value: T | ((prev: T) => T)) => void, boolean, string | null] {
  return usePersistentState(key, initialValue, {
    ...options,
    encrypt: true
  })
}

/**
 * Hook for user preferences
 */
export function usePreference<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean, string | null] {
  const [state, setState, isLoading, error] = usePersistentState(
    `pref_${key}`,
    defaultValue,
    {
      sanitize: false, // Preferences don't need sanitization
      debounceMs: 500  // Longer debounce for preferences
    }
  )

  return [state, setState, isLoading, error]
}

/**
 * Hook for quiz data with automatic encryption for sensitive data
 */
export function useQuizState<T>(
  slug: string,
  initialValue: T,
  isTemporary = false
): [T, (value: T | ((prev: T) => T)) => void, boolean, string | null] {
  const key = `quiz_${slug}`
  
  return usePersistentState(key, initialValue, {
    storage: isTemporary ? 'sessionStorage' : 'localStorage',
    encrypt: !isTemporary, // Encrypt persistent quiz data
    sanitize: true,
    syncAcrossTabs: !isTemporary
  })
}

// ============================================================================
// BACKWARD COMPATIBILITY HOOKS
// ============================================================================

/**
 * Simple localStorage hook (backward compatibility)
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = usePersistentState(key, initialValue, {
    storage: 'localStorage',
    syncAcrossTabs: false // Keep simple for compatibility
  })

  return [state, setState]
}

/**
 * Legacy persistent state hook (backward compatibility)
 */
export function usePersistentStateLegacy<T>(
  key: string,
  initialValue: T,
  options: {
    serialize?: (value: T) => string
    deserialize?: (value: string) => T
    storage?: Storage
  } = {}
): [T, (value: T | ((prev: T) => T)) => void] {
  const storageType = options.storage === sessionStorage ? 'sessionStorage' : 'localStorage'
  
  const [state, setState] = usePersistentState(key, initialValue, {
    storage: storageType,
    serialize: options.serialize,
    deserialize: options.deserialize,
    syncAcrossTabs: false // Legacy behavior
  })

  return [state, setState]
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to get storage stats and status
 */
export function useStorageStats() {
  const [stats, setStats] = useState({ localStorage: 0, sessionStorage: 0, total: 0 })

  useEffect(() => {
    const updateStats = () => {
      setStats(storage.getStats())
    }

    updateStats()
    const interval = setInterval(updateStats, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  return stats
}

/**
 * Hook to clear storage with pattern matching
 */
export function useStorageCleaner() {
  const clearByPattern = useCallback((pattern: string, storageType: 'localStorage' | 'sessionStorage' = 'localStorage') => {
    return storage.clear(pattern, { storage: storageType })
  }, [])

  const clearAll = useCallback((storageType: 'localStorage' | 'sessionStorage' = 'localStorage') => {
    return storage.clear(undefined, { storage: storageType })
  }, [])

  return { clearByPattern, clearAll }
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default usePersistentState
