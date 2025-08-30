// lib/rate-limit.ts
import { Redis } from '@upstash/redis'

// Initialize Redis client if available, otherwise use in-memory fallback
let redis: Redis | null = null

if (typeof window === "undefined") {
  // server-only Redis init
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = require('@upstash/redis')
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    } catch (e) {
      console.warn('Failed to initialize Redis client, using in-memory fallback')
    }
  }
}

// In-memory fallback for development or when Redis is unavailable
const memoryStore = new Map<string, { count: number, timestamp: number }>()

interface RateLimitOptions {
  limit?: number        // Max number of requests
  windowInSeconds?: number  // Time window in seconds
  identifier?: string   // Additional identifier (e.g., route)
}

/**
 * Rate limit function that uses Redis if available, otherwise falls back to in-memory
 */
export async function rateLimit(
  userId: string, 
  options: RateLimitOptions = {}
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const { 
    limit = 10,           // Default: 10 requests
    windowInSeconds = 60, // Default: 1 minute window
    identifier = 'chat',  // Default identifier
  } = options
  
  const key = `rate-limit:${identifier}:${userId}`
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - windowInSeconds
  
  // Use Redis if available
  if (redis) {
    try {
      // Remove old entries and add current timestamp
      await redis.zremrangebyscore(key, 0, windowStart)
      await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` })
      
      // Set expiration and get count
      await redis.expire(key, windowInSeconds * 2)
      const count = await redis.zcard(key)
      
      return {
        success: count <= limit,
        limit,
        remaining: Math.max(0, limit - count),
        reset: now + windowInSeconds,
      }
    } catch (e) {
      console.error('Redis rate limiting error:', e)
      // Fall back to memory store on Redis error
    }
  }
  
  // In-memory fallback
  if (!memoryStore.has(key)) {
    memoryStore.set(key, { count: 1, timestamp: now })
    return { success: true, limit, remaining: limit - 1, reset: now + windowInSeconds }
  }
  
  const entry = memoryStore.get(key)!
  
  // Reset if window has passed
  if (entry.timestamp < windowStart) {
    memoryStore.set(key, { count: 1, timestamp: now })
    return { success: true, limit, remaining: limit - 1, reset: now + windowInSeconds }
  }
  
  // Increment counter
  entry.count++
  memoryStore.set(key, entry)
  
  // Clean up old entries periodically to prevent memory leaks
  if (Math.random() < 0.01) { // 1% chance to clean up
    for (const [k, v] of memoryStore.entries()) {
      if (v.timestamp < windowStart) memoryStore.delete(k)
    }
  }
  
  return {
    success: entry.count <= limit,
    limit,
    remaining: Math.max(0, limit - entry.count),
    reset: entry.timestamp + windowInSeconds,
  }
}
