"use client"

import { storageManager } from './storage-manager'

/**
 * Migration utility to move existing localStorage data to the new StorageManager
 * This should be called once during app initialization
 */
export class StorageMigrator {
  private static migratedKey = 'storage_migration_completed'

  static migrateAllData(): void {
    if (typeof window === 'undefined') return

    // Check if migration already completed
    if (localStorage.getItem(this.migratedKey)) {
      return
    }

    console.log('Starting localStorage migration to StorageManager...')

    try {
      // Run all migrations
      this.migrateVideoSettings()
      this.migrateQuizProgress()
      this.migrateUserPreferences()
      this.migrateCourseSettings()
      this.migrateDebugLogs()

      // Mark migration as complete
      localStorage.setItem(this.migratedKey, 'true')

      console.log('localStorage migration completed successfully')
    } catch (error) {
      console.warn('Storage migration failed:', error)
    }
  }

  private static migrateVideoSettings(): void {
    const oldKeys = [
      'VIDEO_PLAYER_VOLUME',
      'video-player-volume',
      'video-autoplay',
      'video-theater-mode',
      'mini-player-pos',
      'hasPlayedFreeVideo',
      'playerPreferences'
    ]

    const settings: any = {}

    oldKeys.forEach(key => {
      const value = localStorage.getItem(key)
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
            case 'playerPreferences':
              const prefs = JSON.parse(value)
              Object.assign(settings, prefs)
              break
          }
        } catch {
          // Ignore parsing errors
        }
        localStorage.removeItem(key)
      }
    })

    if (Object.keys(settings).length > 0) {
      storageManager.saveVideoSettings(settings)
    }
  }

  private static migrateQuizProgress(): void {
    const keys = Object.keys(localStorage)
    const oldProgressKeys = keys.filter(key =>
      key.startsWith('quiz-progress-') ||
      key.includes('QUIZ_STATE:')
    )

    oldProgressKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key)
        if (data) {
          const oldProgress = JSON.parse(data)

          if (key.startsWith('quiz-progress-')) {
            // Handle old quiz progress format
            const parts = key.replace('quiz-progress-', '').split('_')
            if (parts.length >= 2) {
              const courseId = parts[0]
              const chapterId = parts.slice(1).join('_')

              const newProgress = {
                courseId,
                chapterId,
                currentQuestionIndex: oldProgress.currentQuestionIndex || 0,
                answers: oldProgress.answers || {},
                timeSpent: oldProgress.timeSpent || 0,
                lastUpdated: oldProgress.lastUpdated ? new Date(oldProgress.lastUpdated).getTime() : Date.now(),
                isCompleted: oldProgress.isCompleted || false
              }

              storageManager.saveQuizProgress(newProgress)
            }
          } else if (key.includes('QUIZ_STATE:')) {
            // Handle Redux quiz state format
            const parts = key.split(':')
            if (parts.length >= 3) {
              const quizType = parts[1]
              const slug = parts[2]

              const newProgress = {
                courseId: slug,
                chapterId: `${quizType}_${slug}`,
                currentQuestionIndex: oldProgress.currentQuestionIndex || 0,
                answers: {},
                timeSpent: 0,
                lastUpdated: oldProgress.updatedAt || Date.now(),
                isCompleted: false
              }

              storageManager.saveQuizProgress(newProgress)
            }
          }
        }
      } catch (error) {
        console.warn(`Failed to migrate quiz progress for key "${key}":`, error)
      }
      localStorage.removeItem(key)
    })
  }

  private static migrateUserPreferences(): void {
    const oldKeys = [
      'hasSeenChatTooltip',
      'autoplay_mode'
    ]

    const prefs: any = {}

    oldKeys.forEach(key => {
      const value = localStorage.getItem(key)
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
        localStorage.removeItem(key)
      }
    })

    if (Object.keys(prefs).length > 0) {
      storageManager.saveUserPreferences(prefs)
    }
  }

  private static migrateCourseSettings(): void {
    const keys = Object.keys(localStorage)
    const courseKeys = keys.filter(key => key.startsWith('autoplay_mode_course_'))

    courseKeys.forEach(key => {
      try {
        const courseId = key.replace('autoplay_mode_course_', '')
        const value = localStorage.getItem(key)
        if (value) {
          const autoplayMode = JSON.parse(value)
          storageManager.saveCourseSettings(courseId, { autoplayMode })
        }
      } catch (error) {
        console.warn(`Failed to migrate course settings for key "${key}":`, error)
      }
      localStorage.removeItem(key)
    })
  }

  private static migrateDebugLogs(): void {
    const debugKeys = ['quiz_error_logs']

    debugKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key)
        if (value) {
          const logs = JSON.parse(value)
          storageManager.saveDebugLogs(logs)
        }
      } catch (error) {
        console.warn(`Failed to migrate debug logs for key "${key}":`, error)
      }
      localStorage.removeItem(key)
    })
  }

  static clearMigrationFlag(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.migratedKey)
    }
  }

  static forceReMigration(): void {
    this.clearMigrationFlag()
    this.migrateAllData()
  }
}
