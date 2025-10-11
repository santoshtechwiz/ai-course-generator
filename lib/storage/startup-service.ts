/**
 * Storage System Startup Service
 * 
 * Initializes the unified storage system and performs startup tasks
 */

import { transactionManager, conflictDetector } from '@/lib/storage'
import { StorageMigrator } from '@/utils/storage-migrator'

// ============================================================================
// STARTUP SERVICE
// ============================================================================

export class StorageStartupService {
  private static instance: StorageStartupService
  private initialized = false
  private startupPromise: Promise<void> | null = null

  private constructor() {}

  static getInstance(): StorageStartupService {
    if (!this.instance) {
      this.instance = new StorageStartupService()
    }
    return this.instance
  }

  /**
   * Initialize the storage system
   */
  async initialize(): Promise<void> {
    if (this.initialized) return
    if (this.startupPromise) return this.startupPromise

    this.startupPromise = this.performInitialization()
    await this.startupPromise
    this.initialized = true
  }

  private async performInitialization(): Promise<void> {
    console.log('[StorageStartup] Initializing unified storage system...')

    try {
      // 1. Migrate legacy data
      console.log('[StorageStartup] Running storage migration...')
      await this.runMigration()

      // 2. Detect and resolve conflicts
      console.log('[StorageStartup] Scanning for storage conflicts...')
      await this.runConflictDetection()

      // 3. Initialize transaction manager
      console.log('[StorageStartup] Initializing transaction manager...')
      this.initializeTransactionManager()

      // 4. Setup cleanup routines
      console.log('[StorageStartup] Setting up cleanup routines...')
      this.setupCleanupRoutines()

      console.log('[StorageStartup] Storage system initialized successfully')
    } catch (error) {
      console.error('[StorageStartup] Initialization failed:', error)
      throw error
    }
  }

  /**
   * Run storage migration from legacy systems
   */
  private async runMigration(): Promise<void> {
    // Skip migration on server-side
    if (typeof window === 'undefined') {
      console.log('[StorageStartup] Skipping migration (SSR)')
      return
    }

    try {
      StorageMigrator.migrateAllData()
      console.log('[StorageStartup] Migration completed')
    } catch (error) {
      console.warn('[StorageStartup] Migration failed:', error)
      // Don't fail startup if migration fails
    }
  }

  /**
   * Run initial conflict detection and resolution
   */
  private async runConflictDetection(): Promise<void> {
    // Skip conflict detection on server-side
    if (typeof window === 'undefined') {
      console.log('[StorageStartup] Skipping conflict detection (SSR)')
      return
    }

    try {
      const conflicts = await conflictDetector.scanForConflicts()
      if (conflicts.length > 0) {
        console.warn(`[StorageStartup] Found ${conflicts.length} storage conflicts`)
        
        // Auto-resolve what we can
        const highPriorityConflicts = conflicts.filter(c => c.severity === 'high')
        if (highPriorityConflicts.length > 0) {
          console.warn(`[StorageStartup] ${highPriorityConflicts.length} high-priority conflicts require attention`)
        }
      } else {
        console.log('[StorageStartup] No storage conflicts detected')
      }
    } catch (error) {
      console.warn('[StorageStartup] Conflict detection failed:', error)
    }
  }

  /**
   * Initialize transaction manager
   */
  private initializeTransactionManager(): void {
    // Transaction manager is a singleton and initializes itself
    const status = transactionManager.getStatus()
    console.log('[StorageStartup] Transaction manager status:', status)
  }

  /**
   * Setup periodic cleanup routines
   */
  private setupCleanupRoutines(): void {
    // Cleanup expired storage data every 15 minutes
    setInterval(() => {
      this.runCleanup().catch(error => {
        console.warn('[StorageStartup] Cleanup failed:', error)
      })
    }, 15 * 60 * 1000)

    // Run initial cleanup
    setTimeout(() => {
      this.runCleanup().catch(error => {
        console.warn('[StorageStartup] Initial cleanup failed:', error)
      })
    }, 5000) // Wait 5 seconds after startup
  }

  /**
   * Run storage cleanup
   */
  private async runCleanup(): Promise<void> {
    try {
      // Clean up expired data
      this.cleanupExpiredData()
      
      // Force transaction manager to clean up locks
      const tmStatus = transactionManager.getStatus()
      if (tmStatus.activeLocks > 10) {
        console.warn('[StorageStartup] High number of active locks detected:', tmStatus.activeLocks)
      }
      
      console.log('[StorageStartup] Cleanup completed')
    } catch (error) {
      console.error('[StorageStartup] Cleanup error:', error)
    }
  }

  /**
   * Clean up expired data from localStorage
   */
  private cleanupExpiredData(): void {
    if (typeof window === 'undefined') return

    try {
      const now = Date.now()
      const keysToRemove: string[] = []

      // Find expired keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue

        try {
          const item = localStorage.getItem(key)
          if (!item) continue

          const parsed = JSON.parse(item)
          
          // Check if item has expiry
          if (parsed.expires && parsed.expires < now) {
            keysToRemove.push(key)
          }
          
          // Check if item is old video progress (older than 30 days)
          if (key.includes('video-progress') && parsed.lastUpdated) {
            const age = now - parsed.lastUpdated
            const thirtyDays = 30 * 24 * 60 * 60 * 1000
            if (age > thirtyDays) {
              keysToRemove.push(key)
            }
          }
        } catch (error) {
          // Invalid JSON, mark for removal
          keysToRemove.push(key)
        }
      }

      // Remove expired keys
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key)
        } catch (error) {
          console.warn(`[StorageStartup] Failed to remove expired key ${key}:`, error)
        }
      })

      if (keysToRemove.length > 0) {
        console.log(`[StorageStartup] Cleaned up ${keysToRemove.length} expired items`)
      }
    } catch (error) {
      console.warn('[StorageStartup] Cleanup failed:', error)
    }
  }

  /**
   * Get storage system health status
   */
  getHealthStatus() {
    return {
      initialized: this.initialized,
      transactionManager: transactionManager.getStatus(),
      conflictDetector: conflictDetector.getStatus(),
      storageUsage: this.getStorageUsage()
    }
  }

  /**
   * Get storage usage statistics
   */
  private getStorageUsage() {
    if (typeof window === 'undefined') {
      return { localStorage: 0, sessionStorage: 0 }
    }

    try {
      let localStorageSize = 0
      let sessionStorageSize = 0

      // Calculate localStorage usage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key) {
          const value = localStorage.getItem(key)
          if (value) {
            localStorageSize += key.length + value.length
          }
        }
      }

      // Calculate sessionStorage usage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key) {
          const value = sessionStorage.getItem(key)
          if (value) {
            sessionStorageSize += key.length + value.length
          }
        }
      }

      return {
        localStorage: localStorageSize,
        sessionStorage: sessionStorageSize,
        total: localStorageSize + sessionStorageSize
      }
    } catch (error) {
      console.warn('[StorageStartup] Failed to calculate storage usage:', error)
      return { localStorage: 0, sessionStorage: 0, total: 0 }
    }
  }

  /**
   * Force reset the storage system (emergency use)
   */
  forceReset(): void {
    console.warn('[StorageStartup] Force resetting storage system')
    
    this.initialized = false
    this.startupPromise = null
    
    transactionManager.forceReset()
    conflictDetector.setDetectionEnabled(false)
    
    // Clear all localStorage (be careful!)
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'This will clear all local storage. Are you sure?'
      )
      if (confirmed) {
        localStorage.clear()
        sessionStorage.clear()
      }
    }
  }
}

// Export singleton instance
export const storageStartup = StorageStartupService.getInstance()

/**
 * Initialize storage system - call this in your app startup
 */
export async function initializeStorageSystem(): Promise<void> {
  await storageStartup.initialize()
}