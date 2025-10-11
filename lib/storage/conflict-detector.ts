/**
 * Storage Conflict Detection and Resolution Service
 * 
 * Identifies and resolves conflicts between different storage systems
 */

import store from '@/store'
import { storage } from './legacy-storage'
import { storageManager } from '@/utils/storage-manager'

// ============================================================================
// TYPES
// ============================================================================

export interface StorageConflict {
  key: string
  type: 'video_progress' | 'chapter_completion' | 'preferences'
  sources: {
    redux: any
    unifiedStorage: any
    storageManager: any
    localStorage: any
  }
  timestamp: number
  severity: 'low' | 'medium' | 'high'
  resolution?: 'latest_wins' | 'merge' | 'manual'
}

export interface ConflictResolution {
  conflicts: StorageConflict[]
  resolved: number
  failed: number
  strategy: string
}

// ============================================================================
// CONFLICT DETECTOR
// ============================================================================

export class StorageConflictDetector {
  private static instance: StorageConflictDetector
  private detectionEnabled = true
  private lastScan = 0
  private readonly SCAN_INTERVAL = 30000 // 30 seconds

  private constructor() {
    // Only start auto-scan in browser environment
    if (typeof window !== 'undefined') {
      // Auto-scan periodically
      setInterval(() => this.scanForConflicts(), this.SCAN_INTERVAL)
    }
  }

  static getInstance(): StorageConflictDetector {
    if (!this.instance) {
      this.instance = new StorageConflictDetector()
    }
    return this.instance
  }

  /**
   * Scan for conflicts across all storage systems
   */
  async scanForConflicts(): Promise<StorageConflict[]> {
    if (!this.detectionEnabled) return []
    
    // Skip scanning on server-side
    if (typeof window === 'undefined') {
      return []
    }

    const conflicts: StorageConflict[] = []
    const now = Date.now()

    try {
      // Get all video progress keys from different sources
      const progressKeys = this.getVideoProgressKeys()
      
      for (const key of progressKeys) {
        const conflict = await this.detectVideoProgressConflict(key)
        if (conflict) {
          conflicts.push(conflict)
        }
      }

      this.lastScan = now
      
      if (conflicts.length > 0) {
        console.warn(`[ConflictDetector] Found ${conflicts.length} storage conflicts`)
        
        // Auto-resolve low severity conflicts
        const autoResolved = await this.autoResolveConflicts(
          conflicts.filter(c => c.severity === 'low')
        )
        
        if (autoResolved.resolved > 0) {
          console.log(`[ConflictDetector] Auto-resolved ${autoResolved.resolved} conflicts`)
        }
      }

      return conflicts
    } catch (error) {
      console.error('[ConflictDetector] Scan failed:', error)
      return []
    }
  }

  /**
   * Detect conflicts for a specific video progress key
   */
  private async detectVideoProgressConflict(key: string): Promise<StorageConflict | null> {
    try {
      const sources = {
        redux: this.getReduxVideoProgress(key),
        unifiedStorage: storage.getItem(key),
        storageManager: this.getStorageManagerProgress(key),
        localStorage: this.getLocalStorageProgress(key)
      }

      // Filter out null/undefined sources
      const validSources = Object.entries(sources).filter(([_, value]) => value != null)
      
      if (validSources.length <= 1) {
        return null // No conflict if only one source has data
      }

      // Check for actual conflicts (different values)
      const hasConflict = this.hasProgressConflict(validSources.map(([_, value]) => value))
      
      if (!hasConflict) {
        return null
      }

      // Determine conflict severity
      const severity = this.determineConflictSeverity(validSources)

      return {
        key,
        type: 'video_progress',
        sources,
        timestamp: Date.now(),
        severity,
        resolution: severity === 'low' ? 'latest_wins' : 'manual'
      }
    } catch (error) {
      console.error(`[ConflictDetector] Error detecting conflict for ${key}:`, error)
      return null
    }
  }

  /**
   * Check if progress values actually conflict
   */
  private hasProgressConflict(progressValues: any[]): boolean {
    if (progressValues.length <= 1) return false

    // Compare progress percentages with tolerance
    const tolerance = 5 // 5% tolerance
    const progressPercentages = progressValues
      .map(p => p?.progress || p?.played || 0)
      .filter(p => typeof p === 'number')

    if (progressPercentages.length <= 1) return false

    const min = Math.min(...progressPercentages)
    const max = Math.max(...progressPercentages)
    
    return (max - min) > tolerance
  }

  /**
   * Determine conflict severity based on differences
   */
  private determineConflictSeverity(sources: [string, any][]): 'low' | 'medium' | 'high' {
    const progressValues = sources.map(([_, value]) => value?.progress || value?.played || 0)
    const maxDiff = Math.max(...progressValues) - Math.min(...progressValues)
    
    if (maxDiff <= 10) return 'low'
    if (maxDiff <= 25) return 'medium'
    return 'high'
  }

  /**
   * Auto-resolve conflicts using predefined strategies
   */
  async autoResolveConflicts(conflicts: StorageConflict[]): Promise<ConflictResolution> {
    let resolved = 0
    let failed = 0

    for (const conflict of conflicts) {
      try {
        await this.resolveConflict(conflict)
        resolved++
      } catch (error) {
        console.error(`[ConflictDetector] Failed to resolve conflict ${conflict.key}:`, error)
        failed++
      }
    }

    return {
      conflicts,
      resolved,
      failed,
      strategy: 'latest_wins'
    }
  }

  /**
   * Resolve a single conflict
   */
  private async resolveConflict(conflict: StorageConflict): Promise<void> {
    switch (conflict.resolution) {
      case 'latest_wins':
        await this.resolveWithLatestWins(conflict)
        break
      case 'merge':
        await this.resolveWithMerge(conflict)
        break
      default:
        console.warn(`[ConflictDetector] No resolution strategy for ${conflict.key}`)
    }
  }

  /**
   * Resolve conflict by using the most recent data
   */
  private async resolveWithLatestWins(conflict: StorageConflict): Promise<void> {
    const candidates = Object.entries(conflict.sources)
      .filter(([_, value]) => value != null)
      .map(([source, value]) => ({
        source,
        value,
        timestamp: value?.lastUpdated || value?.timestamp || 0
      }))
      .sort((a, b) => b.timestamp - a.timestamp)

    if (candidates.length === 0) return

    const winner = candidates[0]
    console.log(`[ConflictDetector] Resolving ${conflict.key} with latest from ${winner.source}`)

    // Update all other sources with the winning value
    await this.propagateWinningValue(conflict.key, winner.value, winner.source)
  }

  /**
   * Resolve conflict by merging data from all sources
   */
  private async resolveWithMerge(conflict: StorageConflict): Promise<void> {
    const validSources = Object.entries(conflict.sources)
      .filter(([_, value]) => value != null)

    if (validSources.length === 0) return

    // For video progress, merge by taking the highest progress value
    // and the most recent timestamp
    const merged = validSources.reduce((acc, [source, value]) => {
      return {
        progress: Math.max(acc.progress || 0, value?.progress || value?.played || 0),
        playedSeconds: Math.max(acc.playedSeconds || 0, value?.playedSeconds || 0),
        lastUpdated: Math.max(acc.lastUpdated || 0, value?.lastUpdated || value?.timestamp || 0),
        completed: acc.completed || value?.completed || false,
        duration: Math.max(acc.duration || 0, value?.duration || 0)
      }
    }, {} as any)

    console.log(`[ConflictDetector] Merging ${conflict.key} from ${validSources.length} sources`)
    await this.propagateWinningValue(conflict.key, merged, '')
  }

  /**
   * Propagate the winning value to all storage systems
   */
  private async propagateWinningValue(key: string, value: any, excludeSource: string): Promise<void> {
    // Update Redux store
    if (excludeSource !== 'redux') {
      // Implementation would depend on specific Redux actions
      console.log(`[ConflictDetector] Would update Redux for ${key}`)
    }

    // Update UnifiedStorage
    if (excludeSource !== 'unifiedStorage') {
      storage.setItem(key, value)
    }

    // Update StorageManager
    if (excludeSource !== 'storageManager') {
      // Implementation would depend on StorageManager API
      console.log(`[ConflictDetector] Would update StorageManager for ${key}`)
    }

    // Update localStorage
    if (excludeSource !== 'localStorage') {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(key, JSON.stringify(value))
        } catch (error) {
          console.warn(`[ConflictDetector] Failed to update localStorage for ${key}:`, error)
        }
      }
    }
  }

  /**
   * Get video progress keys from all storage systems
   */
  private getVideoProgressKeys(): string[] {
    const keys = new Set<string>()

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.debug('[ConflictDetector] Skipping localStorage scan (SSR)')
      return Array.from(keys)
    }

    // From localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('video-progress') || key.includes('video_progress'))) {
          keys.add(key)
        }
      }
    } catch (error) {
      console.warn('[ConflictDetector] Failed to scan localStorage keys:', error)
    }

    // From Redux store
    const state = store.getState()
    if (state.courseProgress?.byCourseId) {
      Object.keys(state.courseProgress.byCourseId).forEach(courseId => {
        keys.add(`video_progress_${courseId}`)
      })
    }

    return Array.from(keys)
  }

  /**
   * Get video progress from Redux store
   */
  private getReduxVideoProgress(key: string): any {
    try {
      const state = store.getState()
      
      // Extract courseId from key
      const match = key.match(/video_progress_(.+)/)
      if (!match) return null

      const courseId = match[1]
      return state.courseProgress?.byCourseId?.[courseId]?.videoProgress
    } catch (error) {
      return null
    }
  }

  /**
   * Get video progress from StorageManager
   */
  private getStorageManagerProgress(key: string): any {
    try {
      // Implementation depends on StorageManager API
      const match = key.match(/video_progress_(.+)_(.+)/)
      if (!match) return null

      const [, courseId, chapterId] = match
      return storageManager.getQuizProgress(courseId, chapterId)
    } catch (error) {
      return null
    }
  }

  /**
   * Get video progress from localStorage
   */
  private getLocalStorageProgress(key: string): any {
    if (typeof window === 'undefined') return null
    
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      return null
    }
  }

  /**
   * Enable or disable conflict detection
   */
  setDetectionEnabled(enabled: boolean): void {
    this.detectionEnabled = enabled
    console.log(`[ConflictDetector] Detection ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Get conflict detection status
   */
  getStatus() {
    return {
      enabled: this.detectionEnabled,
      lastScan: this.lastScan,
      nextScan: this.lastScan + this.SCAN_INTERVAL
    }
  }
}

// Export singleton instance
export const conflictDetector = StorageConflictDetector.getInstance()