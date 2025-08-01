import NodeCache from 'node-cache'
import { v4 as uuidv4 } from 'uuid'

// Simple logger interface
interface Logger {
  info(message: string, meta?: any): void
  error(message: string, meta?: any): void
  warn(message: string, meta?: any): void
}

// Console-based logger implementation
class ConsoleLogger implements Logger {
  info(message: string, meta?: any): void {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta ? JSON.stringify(meta) : '')
  }

  error(message: string, meta?: any): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta ? JSON.stringify(meta) : '')
  }

  warn(message: string, meta?: any): void {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta ? JSON.stringify(meta) : '')
  }
}

export const logger = new ConsoleLogger()

// Cache configuration
export const CACHE_TTL = {
  VIDEO_ID: 60 * 60 * 24, // 24 hours
  TOPIC_SEARCH: 60 * 30,  // 30 minutes
  CHAPTER_STATUS: 60 * 10, // 10 minutes
  FALLBACK_CONTENT: 60 * 60 * 2 // 2 hours
}

// Cache keys
export const CACHE_KEYS = {
  VIDEO_ID: (query: string) => `video:${Buffer.from(query).toString('base64')}`,
  TOPIC_SEARCH: (topic: string) => `topic:${topic}`,
  CHAPTER_STATUS: (chapterId: number) => `chapter:${chapterId}`,
  PROCESSING_LOCK: (chapterId: number) => `lock:chapter:${chapterId}`,
  REQUEST_DEBOUNCE: (topic: string) => `debounce:${topic}`
}

export interface CacheManager {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  del(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  setex(key: string, ttl: number, value: string): Promise<void>
}

// Enhanced in-memory cache with persistence simulation
export class MemoryCache implements CacheManager {
  private cache: NodeCache
  private locks: Map<string, Promise<any>>
  private requestCounters: Map<string, number>

  constructor() {
    this.cache = new NodeCache({
      stdTTL: CACHE_TTL.VIDEO_ID,
      checkperiod: 120,
      useClones: false,
      maxKeys: 10000 // Prevent memory bloat
    })
    
    this.locks = new Map()
    this.requestCounters = new Map()
    
    // Log cache statistics periodically
    setInterval(() => {
      const stats = this.cache.getStats()
      logger.info('Cache stats', {
        keys: stats.keys,
        hits: stats.hits,
        misses: stats.misses,
        hitRate: stats.hits / (stats.hits + stats.misses) || 0
      })
    }, 60000) // Every minute
  }

  async get<T>(key: string): Promise<T | null> {
    const value = this.cache.get<T>(key)
    if (value !== undefined) {
      logger.info('Cache hit', { key })
      return value
    }
    logger.info('Cache miss', { key })
    return null
  }

  async set<T>(key: string, value: T, ttl = CACHE_TTL.VIDEO_ID): Promise<void> {
    this.cache.set(key, value, ttl)
    logger.info('Cache set', { key, ttl })
  }

  async del(key: string): Promise<void> {
    this.cache.del(key)
    logger.info('Cache delete', { key })
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key)
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    this.cache.set(key, value, ttl)
  }

  // Lock mechanism for preventing duplicate requests
  async acquireLock(key: string, operation: () => Promise<any>): Promise<any> {
    if (this.locks.has(key)) {
      logger.info('Waiting for existing operation', { key })
      return await this.locks.get(key)
    }

    const promise = operation()
    this.locks.set(key, promise)

    try {
      const result = await promise
      return result
    } finally {
      this.locks.delete(key)
    }
  }

  // Track request frequency for monitoring
  incrementRequestCounter(key: string): number {
    const current = this.requestCounters.get(key) || 0
    const newCount = current + 1
    this.requestCounters.set(key, newCount)
    
    // Reset counters every hour
    if (newCount === 1) {
      setTimeout(() => {
        this.requestCounters.delete(key)
      }, 60 * 60 * 1000)
    }
    
    return newCount
  }

  getRequestCount(key: string): number {
    return this.requestCounters.get(key) || 0
  }
}

// Create cache manager
export function createCacheManager(): MemoryCache {
  logger.info('Using enhanced in-memory cache')
  return new MemoryCache()
}
