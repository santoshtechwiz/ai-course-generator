/**
 * Unifi} from './legacy-storage'd Storage Hooks
 * 
 * React hooks that provide a consistent interface for working with persistent state
 * across localStorage and sessionStorage with type safety and SSR support.
 * 
 * @author AI Learning Platform
 * @version 3.0.0
 */

"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { storage, StorageOptions } from "./legacy-storage"

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
// SPECIALIZED QUIZ AND USER MANAGEMENT HOOKS
// ============================================================================

/**
 * Hook for managing user preferences with smart defaults and validation
 */
export function useUserPreferences() {
  const [preferences, setPreferences, isLoading, error] = usePreference('user_prefs', {
    theme: 'system' as 'light' | 'dark' | 'system',
    autoplay: false,
    volume: 1,
    playbackRate: 1,
    theaterMode: false,
    hasSeenChatTooltip: false,
    lastUpdated: Date.now()
  })

  const updatePreferences = useCallback((updates: Partial<typeof preferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...updates,
      lastUpdated: Date.now()
    }))
  }, [setPreferences])

  return {
    preferences,
    updatePreferences,
    isLoading,
    error
  }
}

/**
 * Hook for managing quiz history with automatic cleanup (keeps last 2 courses)
 */
export function useQuizHistory() {
  const [history, setHistory, isLoading, error] = usePreference('quiz_history', [] as QuizHistoryEntry[])

  const addQuizEntry = useCallback((entry: QuizHistoryEntry) => {
    setHistory(prev => {
      const existingIndex = prev.findIndex(h => h.courseId === entry.courseId)
      let newHistory = [...prev]

      if (existingIndex >= 0) {
        newHistory[existingIndex] = entry
      } else {
        newHistory.push(entry)
      }

      // Keep only the last 2 courses, sorted by completion time
      return newHistory
        .sort((a, b) => b.completedAt - a.completedAt)
        .slice(0, 2)
    })
  }, [setHistory])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [setHistory])

  return {
    history,
    addQuizEntry,
    clearHistory,
    isLoading,
    error
  }
}

/**
 * Hook for managing quiz progress with automatic expiry (30 days)
 * @deprecated Use the event-driven progress system instead
 */
export function useQuizProgress(courseId: string, chapterId: string) {
  const key = `quiz_progress_${courseId}_${chapterId}`
  const [progress, setProgress, isLoading, error] = useQuizState(key, null as QuizProgress | null)

  const updateProgress = useCallback((updates: Partial<QuizProgress>) => {
    setProgress(prev => ({
      courseId,
      chapterId,
      currentQuestionIndex: 0,
      answers: {},
      timeSpent: 0,
      lastUpdated: Date.now(),
      isCompleted: false,
      ...prev,
      ...updates
    }))
  }, [courseId, chapterId, setProgress])

  const markCompleted = useCallback(() => {
    updateProgress({ isCompleted: true })
  }, [updateProgress])

  const resetProgress = useCallback(() => {
    setProgress(null)
  }, [setProgress])

  return {
    progress,
    updateProgress,
    markCompleted,
    resetProgress,
    isLoading,
    error
  }
}

/**
 * Hook for managing video settings with smart defaults
 */
export function useVideoSettings() {
  const [settings, setSettings, isLoading, error] = usePreference('video_settings', {
    volume: 1,
    muted: false,
    playbackRate: 1,
    autoplay: false,
    theaterMode: false,
    hasPlayedFreeVideo: false,
    lastUpdated: Date.now()
  })

  const updateSettings = useCallback((updates: Partial<typeof settings>) => {
    setSettings(prev => ({
      ...prev,
      ...updates,
      lastUpdated: Date.now()
    }))
  }, [setSettings])

  return {
    settings,
    updateSettings,
    isLoading,
    error
  }
}

/**
 * Hook for managing course-specific settings
 */
export function useCourseSettings(courseId: string) {
  const key = `course_settings_${courseId}`
  const [settings, setSettings, isLoading, error] = usePreference(key, {
    autoplayMode: false,
    lastAccessedChapter: undefined as string | undefined,
    progress: 0,
    lastUpdated: Date.now()
  })

  const updateSettings = useCallback((updates: Partial<typeof settings>) => {
    setSettings(prev => ({
      ...prev,
      ...updates,
      lastUpdated: Date.now()
    }))
  }, [setSettings])

  return {
    settings,
    updateSettings,
    isLoading,
    error
  }
}

/**
 * Hook for managing incomplete quizzes across all courses
 */
export function useIncompleteQuizzes() {
  const [allProgress, setAllProgress] = useState<QuizProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    try {
      const keys = Object.keys(localStorage)
      const progressKeys = keys.filter(key => key.startsWith('quiz_progress_'))

      const incomplete: QuizProgress[] = []
      progressKeys.forEach(key => {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            const progress: QuizProgress = JSON.parse(data)
            if (!progress.isCompleted && (Date.now() - progress.lastUpdated < 30 * 24 * 60 * 60 * 1000)) {
              incomplete.push(progress)
            }
          }
        } catch (error) {
          console.warn(`Failed to load quiz progress for key "${key}":`, error)
        }
      })

      setAllProgress(incomplete.sort((a, b) => b.lastUpdated - a.lastUpdated))
    } catch (error) {
      console.warn('Failed to load incomplete quizzes:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    incompleteQuizzes: allProgress,
    isLoading
  }
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
// TYPES FOR SPECIALIZED HOOKS
// ============================================================================

export interface QuizHistoryEntry {
  courseId: string
  courseName: string
  quizType: string
  completedAt: number
  score?: number
  totalQuestions?: number
  timeSpent?: number
}

export interface QuizProgress {
  courseId: string
  chapterId: string
  currentQuestionIndex: number
  answers: Record<string, any>
  timeSpent: number
  lastUpdated: number
  isCompleted: boolean
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default usePersistentState
