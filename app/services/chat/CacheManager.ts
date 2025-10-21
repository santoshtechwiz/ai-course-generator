/**
 * Cache Manager Service
 * Manages response caching with TTL and intelligent key generation
 */

import { ChatResponse } from '@/types/chat.types'
import { CHAT_CONFIG } from '@/config/chat.config'

interface CacheEntry {
  value: ChatResponse
  expiresAt: number
  hits: number
}

export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map()
  private maxSize: number = 1000 // Maximum cache entries

  constructor() {
    // Clean expired entries every 5 minutes
    setInterval(() => this.cleanExpired(), 5 * 60 * 1000)
  }

  /**
   * Get cached response
   */
  async get(key: string): Promise<ChatResponse | null> {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    // Increment hit counter
    entry.hits++

    // Mark as cached
    return {
      ...entry.value,
      cached: true,
    }
  }

  /**
   * Set cache entry
   */
  async set(key: string, value: ChatResponse, ttlSeconds?: number): Promise<void> {
    // Don't cache if disabled
    if (!CHAT_CONFIG.cacheEnabled) {
      return
    }

    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    const ttl = ttlSeconds || CHAT_CONFIG.cacheTTL
    
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
      hits: 0,
    })
  }

  /**
   * Generate cache key from message
   */
  generateKey(message: string, userId?: string, intent?: string): string {
    // Normalize message to catch similar questions
    const normalized = this.normalizeMessage(message)
    
    // Generate hash
    const hash = this.simpleHash(normalized)
    
    // Include userId and intent for context-specific caching
    const parts = [hash]
    if (userId) parts.push(userId.slice(0, 8)) // First 8 chars of userId
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
      .replace(/[?!.,]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\b(a|an|the|is|are|was|were|be|been|being)\b/g, '') // Remove common words
      .trim()
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Clean expired entries
   */
  private cleanExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Evict oldest/least-used entries using LRU strategy
   */
  private evictOldest(): void {
    // Find entry with lowest hits and oldest expiry
    let oldestKey: string | null = null
    let lowestScore = Infinity

    for (const [key, entry] of this.cache.entries()) {
      // Score = hits - (time until expiry)
      const timeUntilExpiry = (entry.expiresAt - Date.now()) / 1000
      const score = entry.hits - timeUntilExpiry / 3600
      
      if (score < lowestScore) {
        lowestScore = score
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; totalHits: number; hitRate: number } {
    let totalHits = 0
    let totalRequests = 0

    for (const entry of this.cache.values()) {
      totalHits += entry.hits
      totalRequests += entry.hits + 1 // +1 for the initial set
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
