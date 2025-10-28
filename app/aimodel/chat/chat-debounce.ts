/**
 * Performance Optimization Utilities for Chat Module
 * Drop-in replacements and wrappers for better performance
 */

// ============================================
// 1. DEBOUNCED MESSAGE SENDER
// ============================================
/**
 * Prevents rapid-fire duplicate requests
 * Usage in useChatStore.ts
 */
export function createDebouncedSender(delay: number = 500) {
  let timeoutId: NodeJS.Timeout | null = null
  let lastMessage: string = ''

  return (message: string, callback: (msg: string) => void) => {
    // Immediate send if message is different
    if (message !== lastMessage) {
      if (timeoutId) clearTimeout(timeoutId)
      lastMessage = message
      callback(message)
      return
    }

    // Debounce same message
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => {
      callback(message)
      lastMessage = message
    }, delay)
  }
}

// ============================================
// 2. REQUEST QUEUE WITH CONCURRENCY LIMIT
// ============================================
/**
 * Prevents overwhelming the API with concurrent requests
 */
class RequestQueue {
  private queue: Array<() => Promise<any>> = []
  private running = 0
  private maxConcurrent = 3

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      this.process()
    })
  }

  private async process() {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    this.running++
    const fn = this.queue.shift()!
    
    try {
      await fn()
    } finally {
      this.running--
      this.process()
    }
  }
}

export const chatRequestQueue = new RequestQueue()

// ============================================
// 3. SMART CACHE WITH LRU EVICTION
// ============================================
/**
 * Better cache implementation than in-memory Map
 */
interface CacheItem<T> {
  value: T
  expiresAt: number
  lastAccessed: number
  hits: number
}

export class SmartCache<T> {
  private cache = new Map<string, CacheItem<T>>()
  private maxSize: number
  private ttl: number

  constructor(maxSize: number = 1000, ttlSeconds: number = 3600) {
    this.maxSize = maxSize
    this.ttl = ttlSeconds * 1000
  }

  get(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) return null
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }

    // Update access stats
    item.lastAccessed = Date.now()
    item.hits++
    
    return item.value
  }

  set(key: string, value: T, customTtl?: number): void {
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (customTtl ? customTtl * 1000 : this.ttl),
      lastAccessed: Date.now(),
      hits: 0
    })
  }

  private evictLRU(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, item] of this.cache.entries()) {
      // Score based on recency and frequency
      const score = item.lastAccessed + (item.hits * 10000)
      if (score < oldestTime) {
        oldestTime = score
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  getStats() {
    let totalHits = 0
    let totalAge = 0
    const now = Date.now()

    for (const item of this.cache.values()) {
      totalHits += item.hits
      totalAge += (now - item.lastAccessed)
    }

    return {
      size: this.cache.size,
      totalHits,
      avgAge: totalAge / this.cache.size || 0,
      hitRate: totalHits / this.cache.size || 0
    }
  }
}

// ============================================
// 4. BATCH DATABASE OPERATIONS
// ============================================
/**
 * Batch multiple DB writes into single transaction
 */
export class DatabaseBatcher {
  private pendingWrites: Array<() => Promise<any>> = []
  private batchTimeout: NodeJS.Timeout | null = null
  private readonly batchDelay = 100 // ms
  private readonly maxBatchSize = 10

  async queueWrite(operation: () => Promise<any>): Promise<void> {
    this.pendingWrites.push(operation)

    if (this.pendingWrites.length >= this.maxBatchSize) {
      await this.flush()
    } else {
      this.scheduleBatch()
    }
  }

  private scheduleBatch(): void {
    if (this.batchTimeout) return

    this.batchTimeout = setTimeout(() => {
      this.flush()
    }, this.batchDelay)
  }

  private async flush(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    if (this.pendingWrites.length === 0) return

    const operations = [...this.pendingWrites]
    this.pendingWrites = []

    // Execute all operations in parallel
    await Promise.allSettled(operations.map(op => op()))
  }
}

export const dbBatcher = new DatabaseBatcher()

// ============================================
// 5. PARALLEL PRISMA QUERIES
// ============================================
/**
 * Execute multiple Prisma queries in parallel
 */
export async function parallelQueries<T extends Record<string, Promise<any>>>(
  queries: T
): Promise<{ [K in keyof T]: Awaited<T[K]> }> {
  const keys = Object.keys(queries) as Array<keyof T>
  const promises = keys.map(key => queries[key])
  
  const results = await Promise.all(promises)
  
  return keys.reduce((acc, key, index) => {
    acc[key] = results[index]
    return acc
  }, {} as { [K in keyof T]: Awaited<T[K]> })
}

// Usage example:
// const { courses, quizzes, users } = await parallelQueries({
//   courses: prisma.course.findMany({ take: 10 }),
//   quizzes: prisma.userQuiz.findMany({ take: 10 }),
//   users: prisma.user.count()
// })

// ============================================
// 6. RESPONSE TIME MONITOR
// ============================================
/**
 * Track and log slow operations
 */
export class PerformanceMonitor {
  private slowThreshold = 3000 // ms

  async measure<T>(
    label: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now()
    
    try {
      const result = await fn()
      const duration = Date.now() - startTime

      if (duration > this.slowThreshold) {
        console.warn(`[SLOW] ${label} took ${duration}ms`, metadata)
      } else {
        console.log(`[PERF] ${label} took ${duration}ms`)
      }

      return result
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[ERROR] ${label} failed after ${duration}ms`, { error, metadata })
      throw error
    }
  }

  setThreshold(ms: number): void {
    this.slowThreshold = ms
  }
}

export const perfMonitor = new PerformanceMonitor()

// ============================================
// 7. EXPONENTIAL BACKOFF RETRY
// ============================================
/**
 * Retry failed operations with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
    onRetry?: (attempt: number, error: Error) => void
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry
  } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries) {
        break
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
      
      if (onRetry) {
        onRetry(attempt + 1, lastError)
      }

      console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// ============================================
// 8. MEMOIZED FUNCTION WRAPPER
// ============================================
/**
 * Memoize expensive function calls
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    ttl?: number
    maxSize?: number
    keyGenerator?: (...args: Parameters<T>) => string
  } = {}
): T {
  const cache = new SmartCache<ReturnType<T>>(
    options.maxSize || 100,
    options.ttl || 300 // 5 minutes
  )

  const keyGen = options.keyGenerator || ((...args) => JSON.stringify(args))

  return ((...args: Parameters<T>) => {
    const key = keyGen(...args)
    const cached = cache.get(key)

    if (cached !== null) {
      return cached
    }

    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

// ============================================
// 9. INTEGRATION EXAMPLE
// ============================================
/**
 * Example: Using these optimizations in ChatService
 */
/*
import { perfMonitor, withRetry, parallelQueries, SmartCache } from './performance-optimizations'

// In ChatService constructor
private responseCache = new SmartCache<ChatResponse>(1000, 3600)

// Wrap expensive operations
async processMessage(userId: string, message: string, context?: UserContext) {
  return perfMonitor.measure('processMessage', async () => {
    // Check smart cache
    const cacheKey = this.generateCacheKey(message, userId)
    const cached = this.responseCache.get(cacheKey)
    if (cached) return cached

    // Parallel DB queries
    const { courses, quizzes } = await parallelQueries({
      courses: prisma.course.findMany({ take: 10 }),
      quizzes: prisma.userQuiz.findMany({ take: 10 })
    })

    // RAG with retry
    const ragResponse = await withRetry(
      () => this.ragService.generateResponse(userId, message),
      {
        maxRetries: 2,
        onRetry: (attempt, error) => {
          console.warn(`RAG retry ${attempt}:`, error.message)
        }
      }
    )

    const response = { ...ragResponse }
    this.responseCache.set(cacheKey, response)
    return response
  }, { userId, messageLength: message.length })
}
*/

// ============================================
// 10. HEALTH CHECK UTILITIES
// ============================================
export class HealthChecker {
  private checks: Map<string, () => Promise<boolean>> = new Map()

  register(name: string, check: () => Promise<boolean>): void {
    this.checks.set(name, check)
  }

  async runAll(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {}

    for (const [name, check] of this.checks.entries()) {
      try {
        results[name] = await check()
      } catch (error) {
        console.error(`Health check failed: ${name}`, error)
        results[name] = false
      }
    }

    return results
  }

  async isHealthy(): Promise<boolean> {
    const results = await this.runAll()
    return Object.values(results).every(v => v === true)
  }
}

export const healthChecker = new HealthChecker()

// Register checks
// healthChecker.register('database', async () => {
//   try {
//     await prisma.$queryRaw`SELECT 1`
//     return true
//   } catch {
//     return false
//   }
// })