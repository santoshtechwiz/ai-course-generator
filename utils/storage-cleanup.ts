"use client"

import { storageManager } from './storage-manager'

/**
 * Storage cleanup and management utilities
 */
export class StorageCleanup {
  static cleanupOldData(): void {
    console.log('Running manual storage cleanup...')

    // Force cleanup through StorageManager
    storageManager['performCleanup']()

    console.log('Storage cleanup completed')
  }

  static getStorageStats(): {
    totalSize: number
    videoSettings: number
    quizProgress: number
    userPreferences: number
    courseSettings: number
    debugLogs: number
    incompleteQuizzes: number
    quizHistory: number
  } {
    const stats = {
      totalSize: storageManager.getStorageSize(),
      videoSettings: 0,
      quizProgress: 0,
      userPreferences: 0,
      courseSettings: 0,
      debugLogs: 0,
      incompleteQuizzes: storageManager.getIncompleteQuizzes().length,
      quizHistory: storageManager.getQuizHistory().length
    }

    // Estimate sizes for different categories
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        const value = localStorage.getItem(key) || ''
        const size = value.length

        if (key.startsWith('video_settings_')) {
          stats.videoSettings += size
        } else if (key.startsWith('quiz_progress_')) {
          stats.quizProgress += size
        } else if (key.startsWith('user_prefs_')) {
          stats.userPreferences += size
        } else if (key.startsWith('course_settings_')) {
          stats.courseSettings += size
        } else if (key.startsWith('debug_logs_')) {
          stats.debugLogs += size
        }
      })
    }

    return stats
  }

  static clearAllUserData(): void {
    if (confirm('Are you sure you want to clear all user data? This action cannot be undone.')) {
      storageManager.clearAllData()
      console.log('All user data cleared')
    }
  }

  static clearQuizHistory(): void {
    if (confirm('Are you sure you want to clear your quiz history?')) {
      // This will be handled by the StorageManager's cleanup
      storageManager['cleanupOldQuizHistory']()
      console.log('Quiz history cleared')
    }
  }

  static clearIncompleteQuizzes(): void {
    if (confirm('Are you sure you want to clear all incomplete quiz progress?')) {
      const incomplete = storageManager.getIncompleteQuizzes()
      incomplete.forEach(progress => {
        // Remove each incomplete quiz
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.includes(`quiz_progress_${progress.courseId}_${progress.chapterId}`)) {
            localStorage.removeItem(key)
          }
        })
      })
      console.log('Incomplete quizzes cleared')
    }
  }

  static exportUserData(): string {
    const data = {
      userPreferences: storageManager.getUserPreferences(),
      videoSettings: storageManager.getVideoSettings(),
      quizHistory: storageManager.getQuizHistory(),
      incompleteQuizzes: storageManager.getIncompleteQuizzes(),
      exportedAt: new Date().toISOString()
    }

    return JSON.stringify(data, null, 2)
  }

  static importUserData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)

      if (data.userPreferences) {
        storageManager.saveUserPreferences(data.userPreferences)
      }

      if (data.videoSettings) {
        storageManager.saveVideoSettings(data.videoSettings)
      }

      if (data.quizHistory) {
        data.quizHistory.forEach((entry: any) => {
          storageManager.addQuizHistory(entry)
        })
      }

      console.log('User data imported successfully')
      return true
    } catch (error) {
      console.error('Failed to import user data:', error)
      return false
    }
  }

  static resetToDefaults(): void {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      // Reset user preferences
      storageManager.saveUserPreferences({
        theme: 'system',
        autoplay: false,
        volume: 1,
        playbackRate: 1,
        theaterMode: false,
        hasSeenChatTooltip: false
      })

      // Reset video settings
      storageManager.saveVideoSettings({
        volume: 1,
        muted: false,
        playbackRate: 1,
        autoplay: false,
        theaterMode: false
      })

      console.log('Settings reset to defaults')
    }
  }
}
