/**
 * Cache Manager Service - FIXED
 * Manages response caching with TTL and intelligent key generation
 * FIX #3: Proper unique key generation per user to prevent cache collision
 */

import { ChatResponse } from '@/types/chat.types'
import { CHAT_CONFIG } from '@/config/chat.config'
import { logger } from '@/lib/logger'

interface CacheEntry {
  value: ChatResponse
  expiresAt: number
  hits: number
  userId?: string // Track which user's data this is
}

export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map()
  private maxSize: number = 1000

  constructor() {
    setInterval(() => this.cleanExpired(), 5 * 60 * 1000)
  }

  /**
   * Get cached response with user isolation
   */
  async get(key: string, userId?: string): Promise<ChatResponse | null> {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // FIX #3: Verify userId matches to prevent cross-user cache access
    if (userId && entry.userId && entry.userId !== userId) {
      logger.warn('[CacheManager] Cache key accessed by different user, denying')
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    entry.hits++

    return {
      ...entry.value,
      cached: true,
    }
  }

  /**
   * Set cache entry with user isolation
   */
  async set(key: string, value: ChatResponse, ttlSeconds?: number, userId?: string): Promise<void> {
    if (!CHAT_CONFIG.cacheEnabled) {
      return
    }

    // Validate response before caching
    if (!value.content || value.content.trim().length < 10) {
      logger.warn('[CacheManager] Skipping cache for minimal response')
      return
    }

    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    const ttl = ttlSeconds || CHAT_CONFIG.cacheTTL
    
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
      hits: 0,
      userId, // FIX #3: Store userId for isolation
    })

    logger.debug('[CacheManager] Entry cached:', { key, ttl, userId })
  }

  /**
   * Generate cache key from message
   * FIX #3: Full userId hash instead of truncated version
   */
  generateKey(message: string, userId?: string, intent?: string): string {
    const normalized = this.normalizeMessage(message)
    const hash = this.simpleHash(normalized)
    
    // FIX: Hash full userId to avoid collisions
    const userHash = userId ? this.simpleHash(userId).slice(0, 16) : 'anon'
    
    const parts = [hash, userHash]
    if (intent) parts.push(intent)
    
    return parts.join(':')
  }

  /**
   * Normalize message for consistent caching
   */
  private normalizeMessage(message: string): string {
    return message
      .toLowerCase()
      .trim()
      .replace(/[?!.,]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/\b(a|an|the|is|are|was|were|be|been|being)\b/g, '')
      .trim()
  }

  /**
   * Simple hash function for consistent key generation
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Clean expired entries
   */
  private cleanExpired(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      logger.debug('[CacheManager] Cleaned expired entries:', { count: cleanedCount })
    }
  }

  /**
   * Evict oldest/least-used entries using LRU strategy
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let lowestScore = Infinity

    for (const [key, entry] of this.cache.entries()) {
      const timeUntilExpiry = (entry.expiresAt - Date.now()) / 1000
      const score = entry.hits - timeUntilExpiry / 3600
      
      if (score < lowestScore) {
        lowestScore = score
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      logger.debug('[CacheManager] Evicted entry:', { key: oldestKey })
    }
  }

  /**
   * Clear cache for specific user
   */
  clearUserCache(userId: string): void {
    let clearedCount = 0
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.userId === userId) {
        this.cache.delete(key)
        clearedCount++
      }
    }

    if (clearedCount > 0) {
      logger.info('[CacheManager] Cleared user cache:', { userId, count: clearedCount })
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    logger.info('[CacheManager] Cache cleared:', { entriesCleared: size })
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; totalHits: number; hitRate: number } {
    let totalHits = 0
    let totalRequests = 0

    for (const entry of this.cache.values()) {
      totalHits += entry.hits
      totalRequests += entry.hits + 1
    }

    return {
      size: this.cache.size,
      totalHits,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager()