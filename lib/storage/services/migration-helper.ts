/**
 * Migration Helper for Storage Services
 * 
 * Helps migrate from old storage patterns to the unified storage service
 */

import { storage } from '../unified-storage'

/**
 * Migration mapping for common localStorage keys
 */
const STORAGE_KEY_MIGRATIONS: Record<string, {
  newKey?: string
  isSecure?: boolean
  isTemporary?: boolean
  transform?: (value: any) => any
}> = {
  // Auth related
  'authToken': { newKey: 'auth_token', isSecure: true },
  'token': { newKey: 'auth_token', isSecure: true },
  'guestId': { newKey: 'guest_id', isTemporary: true },
  'video-guest-id': { newKey: 'video_guest_id', isTemporary: true },
  'guest-id': { newKey: 'guest_id', isTemporary: true },
  
  // User preferences
  'animationsEnabled': { newKey: 'pref_animations_enabled' },
  'theme': { newKey: 'pref_theme' },
  'language': { newKey: 'pref_language' },
  'hasSeenChatTooltip': { newKey: 'pref_seen_chat_tooltip' },
  'hasSeenTrialModal': { newKey: 'pref_seen_trial_modal' },
  'hasPlayedFreeVideo': { newKey: 'pref_played_free_video' },
  
  // Quiz related
  'pendingQuizResults': { newKey: 'quiz_pending_results', isSecure: true },
  'quiz_error_logs': { newKey: 'debug_quiz_errors', isTemporary: true },
  'flashcard_best_streak': { newKey: 'stats_best_streak' },
  
  // Subscription related
  'pendingSubscription': { newKey: 'subscription_pending', isSecure: true },
  'referralCode': { newKey: 'referral_code' },
  
  // Course related
  'OFFLINE_FLAG': { newKey: 'course_offline_mode', isTemporary: true },
  'QUEUE_KEY': { newKey: 'course_sync_queue', isTemporary: true },
}

/**
 * Migrate old localStorage data to unified storage
 */
export function migrateStorageData(): {
  migrated: number
  errors: string[]
  skipped: string[]
} {
  const results = {
    migrated: 0,
    errors: [] as string[],
    skipped: [] as string[]
  }

  if (typeof window === 'undefined') {
    return results
  }

  // Get all localStorage keys
  const allKeys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) allKeys.push(key)
  }

  // Process each key
  allKeys.forEach(oldKey => {
    try {
      const migration = STORAGE_KEY_MIGRATIONS[oldKey]
      
      if (!migration) {
        // Check for pattern matches
        if (oldKey.startsWith('quiz_')) {
          // Quiz data - secure storage
          const rawValue = localStorage.getItem(oldKey)
          if (rawValue) {
            const success = storage.setSecureItem(oldKey, JSON.parse(rawValue))
            if (success) {
              localStorage.removeItem(oldKey)
              results.migrated++
            } else {
              results.errors.push(`Failed to migrate quiz data: ${oldKey}`)
            }
          }
          return
        }
        
        if (oldKey.startsWith('pref_') || oldKey.startsWith('user_')) {
          // Already in preferred format
          results.skipped.push(oldKey)
          return
        }
        
        results.skipped.push(oldKey)
        return
      }

      // Get old value
      const rawValue = localStorage.getItem(oldKey)
      if (!rawValue) {
        results.skipped.push(oldKey)
        return
      }

      let value: any
      try {
        value = JSON.parse(rawValue)
      } catch {
        value = rawValue // Keep as string if not JSON
      }

      // Transform if needed
      if (migration.transform) {
        value = migration.transform(value)
      }

      // Determine new key
      const newKey = migration.newKey || oldKey

      // Store with appropriate method
      let success = false
      if (migration.isTemporary) {
        success = storage.setTemporary(newKey, value)
      } else if (migration.isSecure) {
        success = storage.setSecureItem(newKey, value)
      } else {
        success = storage.setItem(newKey, value)
      }

      if (success) {
        localStorage.removeItem(oldKey)
        results.migrated++
      } else {
        results.errors.push(`Failed to migrate: ${oldKey}`)
      }

    } catch (error) {
      results.errors.push(`Error migrating ${oldKey}: ${error}`)
    }
  })

  return results
}

/**
 * Create a legacy storage adapter for gradual migration
 */
export function createLegacyStorageAdapter() {
  return {
    getItem: (key: string): string | null => {
      // First try the unified storage
      const unifiedValue = storage.getItem(key)
      if (unifiedValue !== null) {
        return typeof unifiedValue === 'string' ? unifiedValue : JSON.stringify(unifiedValue)
      }

      // Fallback to raw localStorage
      return localStorage.getItem(key)
    },

    setItem: (key: string, value: string): void => {
      // Check if this key should be migrated
      const migration = STORAGE_KEY_MIGRATIONS[key]
      
      if (migration) {
        let parsedValue: any
        try {
          parsedValue = JSON.parse(value)
        } catch {
          parsedValue = value
        }

        const newKey = migration.newKey || key
        
        if (migration.isTemporary) {
          storage.setTemporary(newKey, parsedValue)
        } else if (migration.isSecure) {
          storage.setSecureItem(newKey, parsedValue)
        } else {
          storage.setItem(newKey, parsedValue)
        }
      } else {
        // Use unified storage for new keys
        try {
          const parsedValue = JSON.parse(value)
          storage.setItem(key, parsedValue)
        } catch {
          storage.setItem(key, value)
        }
      }
    },

    removeItem: (key: string): void => {
      const migration = STORAGE_KEY_MIGRATIONS[key]
      const newKey = migration?.newKey || key
      
      storage.removeItem(newKey, {
        storage: migration?.isTemporary ? 'sessionStorage' : 'localStorage'
      })
    },

    clear: (): void => {
      storage.clear()
    },

    get length(): number {
      return storage.getStats().total
    },

    key: (index: number): string | null => {
      // This is harder to implement efficiently, but rarely used
      return null
    }
  }
}

/**
 * Enhanced storage utilities with auto-migration
 */
export const migratedStorage = {
  getItem: <T>(key: string, options?: { defaultValue?: T; secure?: boolean; temporary?: boolean }): T | null => {
    const { defaultValue = null, secure = false, temporary = false } = options || {}
    
    let value: T | null = null
    
    if (temporary) {
      value = storage.getTemporary<T>(key)
    } else if (secure) {
      value = storage.getSecureItem<T>(key)
    } else {
      value = storage.getItem<T>(key)
    }
    
    // If not found, check for legacy key
    if (value === null) {
      const migration = STORAGE_KEY_MIGRATIONS[key]
      if (migration?.newKey && migration.newKey !== key) {
        value = storage.getItem<T>(migration.newKey)
      }
    }
    
    return value ?? defaultValue
  },

  setItem: <T>(key: string, value: T, options?: { secure?: boolean; temporary?: boolean }): boolean => {
    const { secure = false, temporary = false } = options || {}
    
    if (temporary) {
      return storage.setTemporary(key, value)
    } else if (secure) {
      return storage.setSecureItem(key, value)
    } else {
      return storage.setItem(key, value)
    }
  },

  removeItem: (key: string, options?: { temporary?: boolean }): boolean => {
    const { temporary = false } = options || {}
    
    return storage.removeItem(key, {
      storage: temporary ? 'sessionStorage' : 'localStorage'
    })
  },

  // Specific helpers for common patterns
  setPreference: <T>(key: string, value: T): boolean => {
    return storage.setPreference(key, value)
  },

  getPreference: <T>(key: string, defaultValue?: T): T | null => {
    return storage.getPreference(key, defaultValue)
  },

  setQuizData: <T>(slug: string, value: T, temporary = false): boolean => {
    if (temporary) {
      return storage.setTemporary(`quiz_${slug}`, value)
    } else {
      return storage.setSecureItem(`quiz_${slug}`, value)
    }
  },

  getQuizData: <T>(slug: string): T | null => {
    return storage.getQuizResults<T>(slug)
  }
}

// Auto-run migration on import (in browser)
if (typeof window !== 'undefined') {
  // Run migration after a short delay to avoid blocking
  setTimeout(() => {
    const results = migrateStorageData()
    if (results.migrated > 0) {
      console.log(`🔄 Migrated ${results.migrated} storage items to unified storage`)
    }
    if (results.errors.length > 0) {
      console.warn('Storage migration errors:', results.errors)
    }
  }, 1000)
}

export default migratedStorage
