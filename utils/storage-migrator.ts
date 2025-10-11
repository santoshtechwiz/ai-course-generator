/**
 * Storage Migration Utility
 * 
 * Handles migration of data between different storage systems and formats.
 * Ensures backward compatibility when storage systems are updated.
 */

import { simpleStorage } from '@/lib/storage/storage'

// ============================================================================
// STORAGE MIGRATOR CLASS
// ============================================================================

export class StorageMigrator {
  private static readonly MIGRATION_VERSION = '3.0.0'
  private static readonly MIGRATION_KEY = 'storage_migration_version'

  /**
   * Migrate all data from legacy storage systems
   */
  static migrateAllData(): void {
    if (typeof window === 'undefined') {
      console.log('[StorageMigrator] Skipping migration (SSR)')
      return
    }

    try {
      const currentVersion = this.getCurrentMigrationVersion()
      
      if (currentVersion === this.MIGRATION_VERSION) {
        console.log('[StorageMigrator] Already at latest version')
        return
      }

      console.log(`[StorageMigrator] Migrating from ${currentVersion} to ${this.MIGRATION_VERSION}`)

      // Run migration steps
      this.migrateLegacyVideoProgress()
      this.migrateLegacyQuizResults()
      this.migrateLegacyUserPreferences()
      this.cleanupObsoleteKeys()

      // Mark migration as complete
      this.setMigrationVersion(this.MIGRATION_VERSION)
      
      console.log('[StorageMigrator] Migration completed successfully')
    } catch (error) {
      console.error('[StorageMigrator] Migration failed:', error)
      throw error
    }
  }

  /**
   * Get current migration version
   */
  private static getCurrentMigrationVersion(): string {
    if (typeof window === 'undefined') {
      return '1.0.0'
    }
    
    try {
      return localStorage.getItem(this.MIGRATION_KEY) || '1.0.0'
    } catch (error) {
      console.warn('[StorageMigrator] Failed to get migration version:', error)
      return '1.0.0'
    }
  }

  /**
   * Set migration version
   */
  private static setMigrationVersion(version: string): void {
    if (typeof window === 'undefined') {
      return
    }
    
    try {
      localStorage.setItem(this.MIGRATION_KEY, version)
    } catch (error) {
      console.warn('[StorageMigrator] Failed to set migration version:', error)
    }
  }

  /**
   * Migrate legacy video progress data
   */
  private static migrateLegacyVideoProgress(): void {
    try {
      const legacyKeys = this.findLegacyKeys([
        'video-progress-',
        'video_progress_',
        'courseProgress_',
        'chapter_progress_'
      ])

      let migratedCount = 0

      for (const key of legacyKeys) {
        try {
          const value = localStorage.getItem(key)
          if (!value) continue

          const data = JSON.parse(value)
          
          // Convert to new format
          const newKey = this.convertToNewKey(key, 'video_progress')
          simpleStorage.setItem(newKey, {
            ...data,
            migrated: true,
            migratedAt: Date.now(),
            originalKey: key
          })

          migratedCount++
        } catch (error) {
          console.warn(`[StorageMigrator] Failed to migrate ${key}:`, error)
        }
      }

      if (migratedCount > 0) {
        console.log(`[StorageMigrator] Migrated ${migratedCount} video progress items`)
      }
    } catch (error) {
      console.warn('[StorageMigrator] Video progress migration failed:', error)
    }
  }

  /**
   * Migrate legacy quiz results
   */
  private static migrateLegacyQuizResults(): void {
    try {
      const legacyKeys = this.findLegacyKeys([
        'quiz-results-',
        'quiz_results_',
        'quizProgress_',
        'tempQuizResults_'
      ])

      let migratedCount = 0

      for (const key of legacyKeys) {
        try {
          const value = localStorage.getItem(key)
          if (!value) continue

          const data = JSON.parse(value)
          
          // Convert to new format
          const newKey = this.convertToNewKey(key, 'quiz_results')
          simpleStorage.setItem(newKey, {
            ...data,
            migrated: true,
            migratedAt: Date.now(),
            originalKey: key
          })

          migratedCount++
        } catch (error) {
          console.warn(`[StorageMigrator] Failed to migrate ${key}:`, error)
        }
      }

      if (migratedCount > 0) {
        console.log(`[StorageMigrator] Migrated ${migratedCount} quiz result items`)
      }
    } catch (error) {
      console.warn('[StorageMigrator] Quiz results migration failed:', error)
    }
  }

  /**
   * Migrate legacy user preferences
   */
  private static migrateLegacyUserPreferences(): void {
    try {
      const legacyKeys = this.findLegacyKeys([
        'user-prefs-',
        'user_preferences_',
        'settings_',
        'theme_'
      ])

      let migratedCount = 0

      for (const key of legacyKeys) {
        try {
          const value = localStorage.getItem(key)
          if (!value) continue

          const data = JSON.parse(value)
          
          // Convert to new format
          const newKey = this.convertToNewKey(key, 'user_prefs')
          simpleStorage.setItem(newKey, {
            ...data,
            migrated: true,
            migratedAt: Date.now(),
            originalKey: key
          })

          migratedCount++
        } catch (error) {
          console.warn(`[StorageMigrator] Failed to migrate ${key}:`, error)
        }
      }

      if (migratedCount > 0) {
        console.log(`[StorageMigrator] Migrated ${migratedCount} user preference items`)
      }
    } catch (error) {
      console.warn('[StorageMigrator] User preferences migration failed:', error)
    }
  }

  /**
   * Find legacy keys matching patterns
   */
  private static findLegacyKeys(patterns: string[]): string[] {
    const keys: string[] = []
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue

        for (const pattern of patterns) {
          if (key.includes(pattern) && !key.includes('courseai_')) {
            keys.push(key)
            break
          }
        }
      }
    } catch (error) {
      console.warn('[StorageMigrator] Failed to scan localStorage keys:', error)
    }

    return keys
  }

  /**
   * Convert legacy key to new format
   */
  private static convertToNewKey(legacyKey: string, type: string): string {
    // Extract identifier from legacy key
    const parts = legacyKey.split(/[-_]/g)
    const identifier = parts[parts.length - 1] || 'default'
    
    return `migrated_${type}_${identifier}_${Date.now()}`
  }

  /**
   * Clean up obsolete storage keys
   */
  private static cleanupObsoleteKeys(): void {
    try {
      const obsoletePatterns = [
        '__redux_devtools_',
        'debug_',
        'temp_',
        '_test_',
        'cache_expired_'
      ]

      let cleanedCount = 0

      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (!key) continue

        for (const pattern of obsoletePatterns) {
          if (key.includes(pattern)) {
            try {
              localStorage.removeItem(key)
              cleanedCount++
              break
            } catch (error) {
              console.warn(`[StorageMigrator] Failed to remove obsolete key ${key}:`, error)
            }
          }
        }
      }

      if (cleanedCount > 0) {
        console.log(`[StorageMigrator] Cleaned up ${cleanedCount} obsolete keys`)
      }
    } catch (error) {
      console.warn('[StorageMigrator] Cleanup failed:', error)
    }
  }

  /**
   * Reset all migrations (for testing)
   */
  static resetMigrations(): void {
    if (typeof window === 'undefined') {
      console.warn('[StorageMigrator] Reset requires browser environment')
      return
    }
    
    if (process.env.NODE_ENV !== 'development') {
      console.warn('[StorageMigrator] Reset only allowed in development')
      return
    }

    try {
      localStorage.removeItem(this.MIGRATION_KEY)
      console.log('[StorageMigrator] Migration version reset')
    } catch (error) {
      console.warn('[StorageMigrator] Failed to reset migrations:', error)
    }
  }

  /**
   * Get migration status
   */
  static getStatus(): {
    currentVersion: string
    targetVersion: string
    needsMigration: boolean
    isHealthy: boolean
  } {
    const currentVersion = this.getCurrentMigrationVersion()
    const needsMigration = currentVersion !== this.MIGRATION_VERSION
    
    return {
      currentVersion,
      targetVersion: this.MIGRATION_VERSION,
      needsMigration,
      isHealthy: typeof window !== 'undefined' && !!localStorage
    }
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const getMigrationStatus = () => StorageMigrator.getStatus()

export default StorageMigrator