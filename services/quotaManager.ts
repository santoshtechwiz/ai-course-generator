import { createHash } from 'crypto'

interface QuotaConfig {
  dailyLimit: number
  softLimitPercentage: number // 80% of daily limit
  cacheDurationHours: number
  disableDurationHours: number // 12 hours
}

interface QuotaState {
  requestCount: number
  lastReset: Date
  isDisabled: boolean
  disabledUntil: Date | null
  softLimitMode: boolean
}

interface CacheEntry {
  result: any
  timestamp: number
  expiresAt: number
}

class QuotaManager {
  private static instance: QuotaManager
  private config: QuotaConfig
  private state: QuotaState
  private cache: Map<string, CacheEntry> = new Map()

  private constructor() {
    this.config = {
      dailyLimit: parseInt(process.env.YOUTUBE_DAILY_QUOTA || '10000'),
      softLimitPercentage: 80,
      cacheDurationHours: 24,
      disableDurationHours: 12
    }

    this.state = {
      requestCount: 0,
      lastReset: new Date(),
      isDisabled: false,
      disabledUntil: null,
      softLimitMode: false
    }

    // Load state from memory/storage if available
    this.loadState()
    // Reset counters daily
    this.scheduleDailyReset()
  }

  static getInstance(): QuotaManager {
    if (!QuotaManager.instance) {
      QuotaManager.instance = new QuotaManager()
    }
    return QuotaManager.instance
  }

  // Generate SHA256 hash for cache key
  private generateCacheKey(query: string): string {
    return createHash('sha256').update(query.trim().toLowerCase()).digest('hex')
  }

  // Check if we're in soft limit mode (>80% usage)
  private checkSoftLimit(): boolean {
    const usagePercentage = (this.state.requestCount / this.config.dailyLimit) * 100
    return usagePercentage >= this.config.softLimitPercentage
  }

  // Check if quota is exceeded
  isQuotaExceeded(): boolean {
    return this.state.isDisabled || this.state.requestCount >= this.config.dailyLimit
  }

  // Check if we're in soft limit mode
  isSoftLimitMode(): boolean {
    return this.state.softLimitMode || this.checkSoftLimit()
  }

  // Record a request
  recordRequest(): void {
    this.state.requestCount++
    this.state.softLimitMode = this.checkSoftLimit()

    // Check if we've hit the hard limit
    if (this.state.requestCount >= this.config.dailyLimit) {
      this.disableQuota()
    }

    this.saveState()
  }

  // Disable quota for 12 hours
  disableQuota(): void {
    this.state.isDisabled = true
    this.state.disabledUntil = new Date(Date.now() + (this.config.disableDurationHours * 60 * 60 * 1000))
    console.log(`[YouTube API] Quota exceeded — stopping requests for today`)
    this.saveState()
  }

  // Check if quota is currently disabled
  isDisabled(): boolean {
    if (!this.state.isDisabled || !this.state.disabledUntil) {
      return false
    }

    // Check if disable period has expired
    if (new Date() > this.state.disabledUntil) {
      this.state.isDisabled = false
      this.state.disabledUntil = null
      this.saveState()
      return false
    }

    return true
  }

  // Get cache entry
  getCacheEntry(query: string): any | null {
    const key = this.generateCacheKey(query)
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.result
  }

  // Set cache entry
  setCacheEntry(query: string, result: any): void {
    const key = this.generateCacheKey(query)
    const expiresAt = Date.now() + (this.config.cacheDurationHours * 60 * 60 * 1000)

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      expiresAt
    })
  }

  // Get quota status for UI
  getQuotaStatus() {
    const usagePercentage = (this.state.requestCount / this.config.dailyLimit) * 100

    return {
      requestCount: this.state.requestCount,
      dailyLimit: this.config.dailyLimit,
      usagePercentage: Math.round(usagePercentage),
      isDisabled: this.isDisabled(),
      disabledUntil: this.state.disabledUntil,
      softLimitMode: this.isSoftLimitMode(),
      cacheSize: this.cache.size
    }
  }

  // Reset daily counters
  private resetDailyCounters(): void {
    this.state.requestCount = 0
    this.state.lastReset = new Date()
    this.state.softLimitMode = false
    this.state.isDisabled = false
    this.state.disabledUntil = null
    this.saveState()
  }

  // Schedule daily reset
  private scheduleDailyReset(): void {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const timeUntilReset = tomorrow.getTime() - now.getTime()

    setTimeout(() => {
      this.resetDailyCounters()
      // Schedule next reset
      this.scheduleDailyReset()
    }, timeUntilReset)
  }

  // Load state from memory (in production, this could be Redis/database)
  private loadState(): void {
    // For now, state is kept in memory
    // In production, load from Redis or database
  }

  // Save state to memory (in production, save to Redis/database)
  private saveState(): void {
    // For now, state is kept in memory
    // In production, save to Redis or database
  }

  // Clean expired cache entries
  cleanExpiredCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
}

export const quotaManager = QuotaManager.getInstance()