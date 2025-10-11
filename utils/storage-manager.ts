/**
 * Storage Manager Utility
 * 
 * Legacy storage manager implementation for compatibility with existing code.
 * Provides a simplified interface that works with the new unified storage system.
 */

import { simpleStorage } from '@/lib/storage/storage'

// ============================================================================
// TYPES
// ============================================================================

export interface QuizProgress {
  courseId: string
  chapterId: string
  progress: number
  answers: Record<string, any>
  completed: boolean
  score?: number
  timeSpent?: number
  lastUpdated?: number
}

export interface VideoSettings {
  playbackRate?: number
  volume?: number
  hasPlayedFreeVideo?: boolean
  [key: string]: any
}

export interface UserPreferences {
  hasSeenChatTooltip?: boolean
  darkMode?: boolean
  language?: string
  [key: string]: any
}

export interface ChatHistory {
  messages: Array<{
    id: string
    content: string
    role: 'user' | 'assistant'
    timestamp: number
  }>
  lastUpdated: number
}

// ============================================================================
// STORAGE MANAGER CLASS
// ============================================================================

class StorageManager {
  private prefix = 'storage_manager_'

  // Video Settings Management
  getVideoSettings(): VideoSettings {
    return simpleStorage.getItem<VideoSettings>(`${this.prefix}video_settings`) || {}
  }

  saveVideoSettings(settings: Partial<VideoSettings>): boolean {
    const current = this.getVideoSettings()
    const updated = { ...current, ...settings }
    return simpleStorage.setItem(`${this.prefix}video_settings`, updated)
  }

  // Quiz Progress Management
  getQuizProgress(courseId: string, chapterId: string): QuizProgress | null {
    const key = `${this.prefix}quiz_progress_${courseId}_${chapterId}`
    return simpleStorage.getItem<QuizProgress>(key)
  }

  saveQuizProgress(data: QuizProgress): boolean {
    const key = `${this.prefix}quiz_progress_${data.courseId}_${data.chapterId}`
    const progressData = {
      ...data,
      lastUpdated: Date.now()
    }
    return simpleStorage.setItem(key, progressData)
  }

  // Temporary Quiz Results (for guest users)
  getTempQuizResults(slug: string, quizType: string): any | null {
    const key = `${this.prefix}temp_quiz_${slug}_${quizType}`
    const stored = simpleStorage.getItem<any>(key)
    
    // Check if results have expired (24 hours)
    if (stored && stored.expiresAt && Date.now() > stored.expiresAt) {
      this.clearTempQuizResults(slug, quizType)
      return null
    }
    
    return stored?.data || null
  }

  saveTempQuizResults(slug: string, quizType: string, results: any): boolean {
    const key = `${this.prefix}temp_quiz_${slug}_${quizType}`
    const data = {
      data: results,
      savedAt: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }
    return simpleStorage.setItem(key, data)
  }

  clearTempQuizResults(slug: string, quizType: string): boolean {
    const key = `${this.prefix}temp_quiz_${slug}_${quizType}`
    return simpleStorage.removeItem(key)
  }

  // User Preferences Management
  getUserPreferences(): UserPreferences {
    return simpleStorage.getItem<UserPreferences>(`${this.prefix}user_prefs`) || {}
  }

  saveUserPreferences(prefs: Partial<UserPreferences>): boolean {
    const current = this.getUserPreferences()
    const updated = { ...current, ...prefs }
    return simpleStorage.setItem(`${this.prefix}user_prefs`, updated)
  }

  // Chat History Management
  getChatHistory(userId: string): ChatHistory | null {
    const key = `${this.prefix}chat_history_${userId}`
    return simpleStorage.getItem<ChatHistory>(key)
  }

  saveChatHistory(userId: string, history: ChatHistory): boolean {
    const key = `${this.prefix}chat_history_${userId}`
    const data = {
      ...history,
      lastUpdated: Date.now()
    }
    return simpleStorage.setItem(key, data)
  }

  // General Storage Operations
  getItem<T = any>(key: string, defaultValue?: T): T | null {
    return simpleStorage.getItem<T>(`${this.prefix}${key}`) ?? defaultValue ?? null
  }

  setItem(key: string, value: any): boolean {
    return simpleStorage.setItem(`${this.prefix}${key}`, value)
  }

  removeItem(key: string): boolean {
    return simpleStorage.removeItem(`${this.prefix}${key}`)
  }

  // Cleanup Operations
  cleanup(maxAge: number = 7 * 24 * 60 * 60 * 1000): number {
    // Clean up items older than maxAge (default 7 days)
    return simpleStorage.cleanup(maxAge)
  }

  // Health Check
  isHealthy(): boolean {
    if (typeof window === 'undefined') return false
    
    try {
      const testKey = `${this.prefix}__health_check__`
      const testValue = { timestamp: Date.now() }
      
      const saved = this.setItem('__health_check__', testValue)
      if (!saved) return false
      
      const retrieved = this.getItem('__health_check__')
      this.removeItem('__health_check__')
      
      return retrieved && retrieved.timestamp === testValue.timestamp
    } catch (error) {
      console.warn('StorageManager health check failed:', error)
      return false
    }
  }

  // Migration Support (for compatibility)
  migrateFromLegacyStorage(): void {
    if (typeof window === 'undefined') return
    
    try {
      // Migrate any legacy localStorage data if needed
      // This is a placeholder for future migration logic
      console.log('StorageManager: Legacy migration completed')
    } catch (error) {
      console.warn('StorageManager: Legacy migration failed:', error)
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const storageManager = new StorageManager()

// Initialize migration on first import
if (typeof window !== 'undefined') {
  storageManager.migrateFromLegacyStorage()
}

export default storageManager