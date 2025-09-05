/**
 * Centralized Subscription Cache Manager
 * 
 * This addresses the cache consistency issues identified in improvements.md
 * by providing a single source of truth for subscription caching across
 * Redux, service layer, and component caches.
 */

import { logger } from "@/lib/logger"
import { SubscriptionData, SubscriptionDataSchema } from "@/app/types/subscription"

interface CacheEntry<T = any> {
  data: T
  timestamp: number
  version: number
  ttl: number
}

interface CacheStats {
  hits: number
  misses: number
  invalidations: number
  lastCleanup: number
}

/**
 * Centralized cache manager for subscription data
 * Provides consistent caching across all layers
 */
export class SubscriptionCacheManager {
  private static instance: SubscriptionCacheManager
  private cache: Map<string, CacheEntry> = new Map()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    invalidations: 0,
    lastCleanup: Date.now()
  }
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000
  private readonly CLEANUP_INTERVAL = 10 * 60 * 1000 // 10 minutes
  private cleanupTimer: NodeJS.Timeout | null = null
  private version = 1

  private constructor() {
    this.startCleanupTimer()
  }

  static getInstance(): SubscriptionCacheManager {
    if (!this.instance) {
      this.instance = new SubscriptionCacheManager()
    }
    return this.instance
  }

  /**
   * Get subscription data from cache with validation
   */
  getSubscription(userId: string): SubscriptionData | null {
    const key = this.getSubscriptionKey(userId)
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return null
    }

    // Check if entry is expired
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++

    // Validate data structure before returning
    try {
      const validatedData = SubscriptionDataSchema.parse(entry.data)
      return validatedData
    } catch (error) {
      logger.warn(`Invalid cached subscription data for user ${userId}`, error)
      this.cache.delete(key)
      return null
    }
  }

  /**
   * Set subscription data in cache with validation
   */
  setSubscription(userId: string, data: SubscriptionData, customTtl?: number): void {
    try {
      // Validate data before caching
      const validatedData = SubscriptionDataSchema.parse(data)
      
      const key = this.getSubscriptionKey(userId)
      const entry: CacheEntry<SubscriptionData> = {
        data: validatedData,
        timestamp: Date.now(),
        version: this.version,
        ttl: customTtl || this.DEFAULT_TTL
      }

      this.cache.set(key, entry)
      this.enforceMaxSize()
      
      logger.debug(`Cached subscription data for user ${userId}`)
    } catch (error) {
      logger.error(`Failed to cache subscription data for user ${userId}`, error)
    }
  }

  /**
   * Invalidate all cache entries for a specific user
   */
  invalidateUser(userId: string): void {
    const keysToDelete = [
      this.getSubscriptionKey(userId),
      this.getTokenKey(userId),
      this.getBillingKey(userId),
      this.getErrorKey(userId)
    ]

    let deletedCount = 0
    keysToDelete.forEach(key => {
      if (this.cache.delete(key)) {
        deletedCount++
      }
    })

    this.stats.invalidations += deletedCount
    logger.debug(`Invalidated ${deletedCount} cache entries for user ${userId}`)
  }

  /**
   * Invalidate all subscription caches (force refresh)
   */
  invalidateAll(): void {
    const beforeSize = this.cache.size
    this.cache.clear()
    this.version++
    this.stats.invalidations += beforeSize
    
    logger.info(`Invalidated all subscription cache entries (${beforeSize} entries)`)
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats & { size: number; version: number } {
    return {
      ...this.stats,
      size: this.cache.size,
      version: this.version
    }
  }

  /**
   * Manually trigger cache cleanup
   */
  cleanup(): void {
    const before = this.cache.size
    const now = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key)
      }
    }

    const after = this.cache.size
    const cleaned = before - after

    this.stats.lastCleanup = now
    
    if (cleaned > 0) {
      logger.debug(`Cache cleanup removed ${cleaned} expired entries`)
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  /**
   * Enforce maximum cache size using LRU eviction
   */
  private enforceMaxSize(): void {
    if (this.cache.size <= this.MAX_CACHE_SIZE) {
      return
    }

    // Convert to array and sort by timestamp (oldest first)
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp)

    // Remove oldest entries until we're under the limit
    const toRemove = this.cache.size - this.MAX_CACHE_SIZE
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0])
    }

    logger.debug(`Cache size enforcement removed ${toRemove} oldest entries`)
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.CLEANUP_INTERVAL)
  }

  /**
   * Generate cache keys
   */
  private getSubscriptionKey(userId: string): string {
    return `subscription_${userId}`
  }

  private getTokenKey(userId: string): string {
    return `tokens_${userId}`
  }

  private getBillingKey(userId: string): string {
    return `billing_${userId}`
  }

  private getErrorKey(userId: string): string {
    return `error_count_${userId}`
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.cache.clear()
  }
}

// Export singleton instance
export const subscriptionCache = SubscriptionCacheManager.getInstance()
