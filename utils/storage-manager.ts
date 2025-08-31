"use client"

import { STORAGE_KEYS } from '@/constants/global'

// Storage configuration
const STORAGE_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  maxStorageSize: 5 * 1024 * 1024, // 5MB
  quizHistoryLimit: 2, // Keep last 2 courses
  cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
  dataExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days
} as const

// Storage key prefixes for organization
const STORAGE_PREFIXES = {
  USER_PREFERENCES: 'user_prefs_',
  QUIZ_HISTORY: 'quiz_history_',
  QUIZ_PROGRESS: 'quiz_progress_',
  VIDEO_SETTINGS: 'video_settings_',
  COURSE_SETTINGS: 'course_settings_',
  DEBUG_LOGS: 'debug_logs_',
} as const

// Types for our storage system
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system'
  autoplay?: boolean
  volume?: number
  playbackRate?: number
  theaterMode?: boolean
  hasSeenChatTooltip?: boolean
  lastUpdated?: number
}

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

export interface VideoSettings {
  volume: number
  muted: boolean
  playbackRate: number
  autoplay: boolean
  theaterMode: boolean
  miniPlayerPos?: { x: number; y: number }
  hasPlayedFreeVideo?: boolean
}

export interface CourseSettings {
  autoplayMode: boolean
  lastAccessedChapter?: string
  progress?: number
}

/**
 * Smart localStorage Manager with cleanup and organization
 */
class StorageManager {
  private static instance: StorageManager
  private lastCleanup: number = 0

  private constructor() {
    this.initializeCleanup()
  }

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager()
    }
    return StorageManager.instance
  }

  // Safe storage utilities with error handling
  private safeGetItem(key: string): string | null {
    if (typeof window === 'undefined') return null

    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.warn(`Storage read error for key "${key}":`, error)
      return null
    }
  }

  private safeSetItem(key: string, value: string): boolean {
    if (typeof window === 'undefined') return false

    // Check size limit
    if (value.length > STORAGE_CONFIG.maxStorageSize) {
      console.warn(`Value too large for storage key "${key}": ${value.length} bytes`)
      return false
    }

    let attempts = 0
    while (attempts < STORAGE_CONFIG.maxRetries) {
      try {
        localStorage.setItem(key, value)
        return true
      } catch (error) {
        attempts++
        console.warn(`Storage write attempt ${attempts} failed for key "${key}":`, error)

        if (attempts >= STORAGE_CONFIG.maxRetries) {
          return false
        }

        // Wait before retry
        setTimeout(() => {}, STORAGE_CONFIG.retryDelay * attempts)
      }
    }
    return false
  }

  private safeRemoveItem(key: string): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn(`Storage removal error for key "${key}":`, error)
    }
  }

  private initializeCleanup(): void {
    // Run cleanup on initialization
    this.performCleanup()

    // Set up periodic cleanup
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.performCleanup()
      }, STORAGE_CONFIG.cleanupInterval)
    }
  }

  private performCleanup(): void {
    const now = Date.now()
    if (now - this.lastCleanup < STORAGE_CONFIG.cleanupInterval) {
      return
    }

    this.lastCleanup = now
    console.log('Performing localStorage cleanup...')

    try {
      // Clean up old quiz progress
      this.cleanupOldQuizProgress()

      // Clean up old quiz history (keep only last 2 courses)
      this.cleanupOldQuizHistory()

      // Clean up expired data
      this.cleanupExpiredData()

      // Clean up debug logs older than 7 days
      this.cleanupOldDebugLogs()

    } catch (error) {
      console.warn('Cleanup failed:', error)
    }
  }

  private cleanupOldQuizProgress(): void {
    if (typeof window === 'undefined') return

    const keys = Object.keys(localStorage)
    const progressKeys = keys.filter(key => key.startsWith(STORAGE_PREFIXES.QUIZ_PROGRESS))

    progressKeys.forEach(key => {
      try {
        const data = this.safeGetItem(key)
        if (data) {
          const progress: QuizProgress = JSON.parse(data)
          // Remove progress older than 30 days
          if (Date.now() - progress.lastUpdated > STORAGE_CONFIG.dataExpiry) {
            this.safeRemoveItem(key)
          }
        }
      } catch (error) {
        console.warn(`Failed to cleanup quiz progress for key "${key}":`, error)
        this.safeRemoveItem(key)
      }
    })
  }

  private cleanupOldQuizHistory(): void {
    const history = this.getQuizHistory()
    if (history.length > STORAGE_CONFIG.quizHistoryLimit) {
      // Keep only the most recent entries
      const sortedHistory = history.sort((a, b) => b.completedAt - a.completedAt)
      const recentHistory = sortedHistory.slice(0, STORAGE_CONFIG.quizHistoryLimit)
      this.saveQuizHistory(recentHistory)
    }
  }

  private cleanupExpiredData(): void {
    if (typeof window === 'undefined') return

    const keys = Object.keys(localStorage)
    const now = Date.now()

    keys.forEach(key => {
      try {
        const data = this.safeGetItem(key)
        if (data) {
          const parsed = JSON.parse(data)
          if (parsed.lastUpdated && (now - parsed.lastUpdated > STORAGE_CONFIG.dataExpiry)) {
            this.safeRemoveItem(key)
          }
        }
      } catch {
        // Ignore parsing errors
      }
    })
  }

  private cleanupOldDebugLogs(): void {
    const debugKey = STORAGE_PREFIXES.DEBUG_LOGS + 'quiz_error_logs'
    try {
      const logs = this.safeGetItem(debugKey)
      if (logs) {
        const parsedLogs = JSON.parse(logs)
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
        const recentLogs = parsedLogs.filter((log: any) => log.timestamp > weekAgo)
        this.safeSetItem(debugKey, JSON.stringify(recentLogs))
      }
    } catch (error) {
      console.warn('Failed to cleanup debug logs:', error)
    }
  }

  // User Preferences Management
  getUserPreferences(): UserPreferences {
    const key = STORAGE_PREFIXES.USER_PREFERENCES + 'main'
    const data = this.safeGetItem(key)
    if (data) {
      try {
        return JSON.parse(data)
      } catch {
        return {}
      }
    }
    return {}
  }

  saveUserPreferences(prefs: Partial<UserPreferences>): void {
    const current = this.getUserPreferences()
    const updated = {
      ...current,
      ...prefs,
      lastUpdated: Date.now()
    }
    const key = STORAGE_PREFIXES.USER_PREFERENCES + 'main'
    this.safeSetItem(key, JSON.stringify(updated))
  }

  // Quiz History Management
  getQuizHistory(): QuizHistoryEntry[] {
    const key = STORAGE_PREFIXES.QUIZ_HISTORY + 'courses'
    const data = this.safeGetItem(key)
    if (data) {
      try {
        return JSON.parse(data)
      } catch {
        return []
      }
    }
    return []
  }

  private saveQuizHistory(history: QuizHistoryEntry[]): void {
    const key = STORAGE_PREFIXES.QUIZ_HISTORY + 'courses'
    this.safeSetItem(key, JSON.stringify(history))
  }

  addQuizHistory(entry: QuizHistoryEntry): void {
    const history = this.getQuizHistory()
    const existingIndex = history.findIndex(h => h.courseId === entry.courseId)

    if (existingIndex >= 0) {
      history[existingIndex] = entry
    } else {
      history.push(entry)
    }

    this.saveQuizHistory(history)
  }

  // Quiz Progress Management
  getQuizProgress(courseId: string, chapterId: string): QuizProgress | null {
    const key = `${STORAGE_PREFIXES.QUIZ_PROGRESS}${courseId}_${chapterId}`
    const data = this.safeGetItem(key)
    if (data) {
      try {
        return JSON.parse(data)
      } catch {
        return null
      }
    }
    return null
  }

  saveQuizProgress(progress: QuizProgress): void {
    const key = `${STORAGE_PREFIXES.QUIZ_PROGRESS}${progress.courseId}_${progress.chapterId}`
    this.safeSetItem(key, JSON.stringify({
      ...progress,
      lastUpdated: Date.now()
    }))
  }

  getIncompleteQuizzes(): QuizProgress[] {
    if (typeof window === 'undefined') return []

    const keys = Object.keys(localStorage)
    const progressKeys = keys.filter(key => key.startsWith(STORAGE_PREFIXES.QUIZ_PROGRESS))

    const incomplete: QuizProgress[] = []
    progressKeys.forEach(key => {
      try {
        const data = this.safeGetItem(key)
        if (data) {
          const progress: QuizProgress = JSON.parse(data)
          if (!progress.isCompleted) {
            incomplete.push(progress)
          }
        }
      } catch (error) {
        console.warn(`Failed to load quiz progress for key "${key}":`, error)
      }
    })

    return incomplete.sort((a, b) => b.lastUpdated - a.lastUpdated)
  }

  // Video Settings Management
  getVideoSettings(): VideoSettings {
    const key = STORAGE_PREFIXES.VIDEO_SETTINGS + 'main'
    const data = this.safeGetItem(key)
    if (data) {
      try {
        return JSON.parse(data)
      } catch {
        return {
          volume: 1,
          muted: false,
          playbackRate: 1,
          autoplay: false,
          theaterMode: false
        }
      }
    }
    return {
      volume: 1,
      muted: false,
      playbackRate: 1,
      autoplay: false,
      theaterMode: false
    }
  }

  saveVideoSettings(settings: Partial<VideoSettings>): void {
    const current = this.getVideoSettings()
    const updated = {
      ...current,
      ...settings,
      lastUpdated: Date.now()
    }
    const key = STORAGE_PREFIXES.VIDEO_SETTINGS + 'main'
    this.safeSetItem(key, JSON.stringify(updated))
  }

  // Course Settings Management
  getCourseSettings(courseId: string): CourseSettings {
    const key = `${STORAGE_PREFIXES.COURSE_SETTINGS}${courseId}`
    const data = this.safeGetItem(key)
    if (data) {
      try {
        return JSON.parse(data)
      } catch {
        return { autoplayMode: false }
      }
    }
    return { autoplayMode: false }
  }

  saveCourseSettings(courseId: string, settings: Partial<CourseSettings>): void {
    const current = this.getCourseSettings(courseId)
    const updated = {
      ...current,
      ...settings,
      lastUpdated: Date.now()
    }
    const key = `${STORAGE_PREFIXES.COURSE_SETTINGS}${courseId}`
    this.safeSetItem(key, JSON.stringify(updated))
  }

  // Debug/Error Logging Management
  getDebugLogs(): any[] {
    const key = STORAGE_PREFIXES.DEBUG_LOGS + 'quiz_error_logs'
    const data = this.safeGetItem(key)
    if (data) {
      try {
        return JSON.parse(data)
      } catch {
        return []
      }
    }
    return []
  }

  saveDebugLogs(logs: any[]): void {
    const key = STORAGE_PREFIXES.DEBUG_LOGS + 'quiz_error_logs'
    this.safeSetItem(key, JSON.stringify(logs))
  }

  // Utility methods
  clearAllData(): void {
    if (typeof window === 'undefined') return

    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('user_prefs_') ||
          key.startsWith('quiz_history_') ||
          key.startsWith('quiz_progress_') ||
          key.startsWith('video_settings_') ||
          key.startsWith('course_settings_') ||
          key.startsWith('debug_logs_')) {
        this.safeRemoveItem(key)
      }
    })
  }

  getStorageSize(): number {
    if (typeof window === 'undefined') return 0

    try {
      let total = 0
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length
        }
      }
      return total
    } catch {
      return 0
    }
  }

  // Migration helpers for existing data
  migrateLegacyData(): void {
    // Migrate old video settings
    this.migrateVideoSettings()

    // Migrate old quiz progress
    this.migrateQuizProgress()

    // Migrate old user preferences
    this.migrateUserPreferences()
  }

  private migrateVideoSettings(): void {
    // Migrate old video settings to new format
    const oldKeys = [
      'VIDEO_PLAYER_VOLUME',
      'video-player-volume',
      'video-autoplay',
      'video-theater-mode',
      'mini-player-pos',
      'hasPlayedFreeVideo'
    ]

    const settings: Partial<VideoSettings> = {}

    oldKeys.forEach(key => {
      const value = this.safeGetItem(key)
      if (value) {
        try {
          switch (key) {
            case 'VIDEO_PLAYER_VOLUME':
            case 'video-player-volume':
              settings.volume = parseFloat(value)
              break
            case 'video-autoplay':
              settings.autoplay = JSON.parse(value)
              break
            case 'video-theater-mode':
              settings.theaterMode = JSON.parse(value)
              break
            case 'mini-player-pos':
              settings.miniPlayerPos = JSON.parse(value)
              break
            case 'hasPlayedFreeVideo':
              settings.hasPlayedFreeVideo = value === 'true'
              break
          }
        } catch {
          // Ignore parsing errors
        }
        this.safeRemoveItem(key)
      }
    })

    if (Object.keys(settings).length > 0) {
      this.saveVideoSettings(settings)
    }
  }

  private migrateQuizProgress(): void {
    if (typeof window === 'undefined') return

    const keys = Object.keys(localStorage)
    const oldProgressKeys = keys.filter(key => key.startsWith('quiz-progress-'))

    oldProgressKeys.forEach(key => {
      try {
        const data = this.safeGetItem(key)
        if (data) {
          const oldProgress = JSON.parse(data)
          // Extract courseId and chapterId from key
          const parts = key.replace('quiz-progress-', '').split('_')
          if (parts.length >= 2) {
            const courseId = parts[0]
            const chapterId = parts.slice(1).join('_')

            const newProgress: QuizProgress = {
              courseId,
              chapterId,
              currentQuestionIndex: oldProgress.currentQuestionIndex || 0,
              answers: oldProgress.answers || {},
              timeSpent: oldProgress.timeSpent || 0,
              lastUpdated: oldProgress.lastUpdated ? new Date(oldProgress.lastUpdated).getTime() : Date.now(),
              isCompleted: oldProgress.isCompleted || false
            }

            this.saveQuizProgress(newProgress)
          }
        }
      } catch (error) {
        console.warn(`Failed to migrate quiz progress for key "${key}":`, error)
      }
      this.safeRemoveItem(key)
    })
  }

  private migrateUserPreferences(): void {
    // Migrate old user preferences
    const oldKeys = ['hasSeenChatTooltip', 'autoplay_mode']

    const prefs: Partial<UserPreferences> = {}

    oldKeys.forEach(key => {
      const value = this.safeGetItem(key)
      if (value) {
        try {
          switch (key) {
            case 'hasSeenChatTooltip':
              prefs.hasSeenChatTooltip = value === 'true'
              break
            case 'autoplay_mode':
              prefs.autoplay = JSON.parse(value)
              break
          }
        } catch {
          // Ignore parsing errors
        }
        this.safeRemoveItem(key)
      }
    })

    if (Object.keys(prefs).length > 0) {
      this.saveUserPreferences(prefs)
    }
  }
}

// Export singleton instance
export const storageManager = StorageManager.getInstance()

// Export types
export type { UserPreferences, QuizHistoryEntry, QuizProgress, VideoSettings, CourseSettings }
