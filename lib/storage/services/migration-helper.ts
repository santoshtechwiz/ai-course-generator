/**
 * Migration Helper for Storage Services
 *
 * Helps migrate from old storage patterns to the unified storage service
 */
import { storage } from '../legacy-storage'

/**
 * Safe JSON parse utility
 */
function tryParseJSON<T = any>(value: string | null, fallback: any = null): T | null {
  if (value === null) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return value as unknown as T // fallback to string if not JSON
  }
}

/**
 * Migration mapping for common localStorage keys
 */
const STORAGE_KEY_MIGRATIONS: Record<
  string,
  {
    newKey?: string
    isSecure?: boolean
    isTemporary?: boolean
    transform?: (value: any) => any
  }
> = {
  // Auth related
  authToken: { newKey: 'auth_token', isSecure: true },
  token: { newKey: 'auth_token', isSecure: true },
  guestId: { newKey: 'guest_id', isTemporary: true },
  'video-guest-id': { newKey: 'video_guest_id', isTemporary: true },
  'guest-id': { newKey: 'guest_id', isTemporary: true },

  // User preferences
  animationsEnabled: { newKey: 'pref_animations_enabled' },
  theme: { newKey: 'pref_theme' },
  language: { newKey: 'pref_language' },
  hasSeenChatTooltip: { newKey: 'pref_seen_chat_tooltip' },
  hasSeenTrialModal: { newKey: 'pref_seen_trial_modal' },
  hasPlayedFreeVideo: { newKey: 'pref_played_free_video' },

  // Quiz related
  pendingQuizResults: { newKey: 'quiz_pending_results', isSecure: true },
  quiz_error_logs: { newKey: 'debug_quiz_errors', isTemporary: true },
  flashcard_best_streak: { newKey: 'stats_best_streak' },

  // Subscription related
  pendingSubscription: { newKey: 'subscription_pending', isSecure: true },
  referralCode: { newKey: 'referral_code' },

  // Course related
  OFFLINE_FLAG: { newKey: 'course_offline_mode', isTemporary: true },
  QUEUE_KEY: { newKey: 'course_sync_queue', isTemporary: true },
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
    skipped: [] as string[],
  }

  if (typeof window === 'undefined') {
    return results
  }

  const allKeys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) allKeys.push(key)
  }

  allKeys.forEach((oldKey) => {
    try {
      const migration = STORAGE_KEY_MIGRATIONS[oldKey]

      if (!migration) {
        // Handle patterns
        if (oldKey.startsWith('quiz_')) {
          const rawValue = localStorage.getItem(oldKey)
          const parsed = tryParseJSON(rawValue)
          if (parsed !== null) {
            const success = storage.setSecureItem(oldKey, parsed)
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
          results.skipped.push(oldKey)
          return
        }

        results.skipped.push(oldKey)
        return
      }

      const rawValue = localStorage.getItem(oldKey)
      if (!rawValue) {
        results.skipped.push(oldKey)
        return
      }

      let value: any = tryParseJSON(rawValue, rawValue)

      if (migration.transform) {
        value = migration.transform(value)
      }

      const newKey = migration.newKey || oldKey
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
    } catch (error: any) {
      results.errors.push(`Error migrating ${oldKey}: ${error?.message || error}`)
    }
  })

  return results
}

/**
 * Legacy adapter to bridge unified storage with localStorage API
 */
export function createLegacyStorageAdapter() {
  return {
    getItem: (key: string): string | null => {
      const unifiedValue = storage.getItem(key)
      if (unifiedValue !== null) {
        return typeof unifiedValue === 'string'
          ? unifiedValue
          : JSON.stringify(unifiedValue)
      }
      return localStorage.getItem(key)
    },

    setItem: (key: string, value: string): void => {
      const migration = STORAGE_KEY_MIGRATIONS[key]
      let parsedValue: any = tryParseJSON(value, value)
      const newKey = migration?.newKey || key

      if (migration) {
        if (migration.isTemporary) {
          storage.setTemporary(newKey, parsedValue)
        } else if (migration.isSecure) {
          storage.setSecureItem(newKey, parsedValue)
        } else {
          storage.setItem(newKey, parsedValue)
        }
      } else {
        storage.setItem(newKey, parsedValue)
      }
    },

    removeItem: (key: string): void => {
      const migration = STORAGE_KEY_MIGRATIONS[key]
      const newKey = migration?.newKey || key
      storage.removeItem(newKey, {
        storage: migration?.isTemporary ? 'sessionStorage' : 'localStorage',
      })
    },

    clear: (): void => {
      storage.clear()
    },

    get length(): number {
      return storage.getStats().total
    },

    key: (_index: number): string | null => {
      return null // rarely used, keeping simple
    },
  }
}

/**
 * Enhanced storage utilities with auto-migration
 */
export const migratedStorage = {
  getItem: <T>(
    key: string,
    options?: { defaultValue?: T; secure?: boolean; temporary?: boolean }
  ): T | null => {
    const { defaultValue = null, secure = false, temporary = false } = options || {}

    let value: T | null = null
    if (temporary) {
      value = storage.getTemporary<T>(key)
    } else if (secure) {
      value = storage.getSecureItem<T>(key)
    } else {
      value = storage.getItem<T>(key)
    }

    if (value === null) {
      const migration = STORAGE_KEY_MIGRATIONS[key]
      if (migration?.newKey && migration.newKey !== key) {
        value = storage.getItem<T>(migration.newKey)
      }
    }

    return value ?? defaultValue
  },

  setItem: <T>(
    key: string,
    value: T,
    options?: { secure?: boolean; temporary?: boolean }
  ): boolean => {
    const { secure = false, temporary = false } = options || {}
    if (temporary) return storage.setTemporary(key, value)
    if (secure) return storage.setSecureItem(key, value)
    return storage.setItem(key, value)
  },

  removeItem: (key: string, options?: { temporary?: boolean }): boolean => {
    const { temporary = false } = options || {}
    return storage.removeItem(key, {
      storage: temporary ? 'sessionStorage' : 'localStorage',
    })
  },

  setPreference: <T>(key: string, value: T): boolean =>
    storage.setPreference(key, value),

  getPreference: <T>(key: string, defaultValue?: T): T | null =>
    storage.getPreference(key, defaultValue),

  setQuizData: <T>(slug: string, value: T, temporary = false): boolean =>
    temporary
      ? storage.setTemporary(`quiz_${slug}`, value)
      : storage.setSecureItem(`quiz_${slug}`, value),

  getQuizData: <T>(slug: string): T | null =>
    storage.getQuizResults<T>(slug),
}

// Auto-run migration
if (typeof window !== 'undefined') {
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
