/**
 * Token Cache Service
 * Centralized token management with performance optimization
 */

import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"
import type { JWT } from "next-auth/jwt"

interface CachedToken {
  token: JWT | null
  expires: number
  isValid: boolean
}

interface TokenCacheOptions {
  cacheDuration?: number
  maxCacheSize?: number
  cleanupInterval?: number
}

export class TokenCacheService {
  private static instance: TokenCacheService
  private cache: Map<string, CachedToken>
  private options: Required<TokenCacheOptions>
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor(options: TokenCacheOptions = {}) {
    this.cache = new Map()
    this.options = {
      cacheDuration: options.cacheDuration || 30 * 1000, // 30 seconds
      maxCacheSize: options.maxCacheSize || 1000, // Max 1000 tokens
      cleanupInterval: options.cleanupInterval || 60 * 1000 // 1 minute
    }
    this.startCleanupTimer()
  }

  static getInstance(options?: TokenCacheOptions): TokenCacheService {
    if (!this.instance) {
      this.instance = new TokenCacheService(options)
    }
    return this.instance
  }

  /**
   * Get cached token or fetch new one
   */
  async getCachedToken(req: NextRequest): Promise<JWT | null> {
    const sessionId = this.getSessionId(req)
    
    if (!sessionId) {
      return null
    }

    // Check cache first
    const cached = this.cache.get(sessionId)
    if (cached && Date.now() < cached.expires && cached.isValid) {
      return cached.token
    }

    // Fetch new token
    try {
      const token = await getToken({ 
        req,
        secureCookie: process.env.NODE_ENV === "production"
      })
      
      // Cache the token
      this.setCache(sessionId, token)
      
      return token
    } catch (error) {
      console.error("Token fetch error:", error)
      
      // Cache the failure
      this.setCache(sessionId, null, false)
      
      return null
    }
  }

  /**
   * Set token in cache
   */
  private setCache(sessionId: string, token: JWT | null, isValid: boolean = true): void {
    // Enforce cache size limit
    if (this.cache.size >= this.options.maxCacheSize) {
      this.evictOldestEntries(Math.floor(this.options.maxCacheSize * 0.1)) // Remove 10%
    }

    this.cache.set(sessionId, {
      token,
      expires: Date.now() + this.options.cacheDuration,
      isValid
    })
  }

  /**
   * Get session ID from request
   */
  private getSessionId(req: NextRequest): string | null {
    return req.cookies.get('next-auth.session-token')?.value || 
           req.cookies.get('__Secure-next-auth.session-token')?.value ||
           null
  }

  /**
   * Invalidate token in cache
   */
  invalidateToken(sessionId: string): void {
    this.cache.delete(sessionId)
  }

  /**
   * Invalidate all tokens for cleanup
   */
  invalidateAll(): void {
    this.cache.clear()
  }

  /**
   * Check if token is admin
   */
  isAdminToken(token: JWT | null): boolean {
    return !!(token && token.isAdmin)
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: JWT | null): boolean {
    if (!token || !token.exp) {
      return true
    }
    
    const tokenExpiry = new Date(Number(token.exp) * 1000)
    return new Date() > tokenExpiry
  }

  /**
   * Get token metadata
   */
  getTokenMetadata(token: JWT | null): {
    isValid: boolean
    isExpired: boolean
    isAdmin: boolean
    userId?: string
    userPlan?: string
  } {
    if (!token) {
      return {
        isValid: false,
        isExpired: true,
        isAdmin: false
      }
    }

    return {
      isValid: true,
      isExpired: this.isTokenExpired(token),
      isAdmin: this.isAdminToken(token),
      userId: token.sub || token.id,
      userPlan: (token as any).plan || 'FREE'
    }
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
    }, this.options.cleanupInterval)
  }

  /**
   * Cleanup expired tokens
   */
  private cleanup(): void {
    const now = Date.now()
    let cleanupCount = 0

    for (const [key, value] of this.cache.entries()) {
      if (now >= value.expires) {
        this.cache.delete(key)
        cleanupCount++
      }
    }

    if (cleanupCount > 0) {
      console.log(`[TokenCache] Cleaned up ${cleanupCount} expired tokens`)
    }
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldestEntries(count: number): void {
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].expires - b[1].expires)
    
    for (let i = 0; i < count && i < entries.length; i++) {
      this.cache.delete(entries[i][0])
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number
    maxSize: number
    hitRate: number
    validTokens: number
    expiredTokens: number
  } {
    const now = Date.now()
    let validTokens = 0
    let expiredTokens = 0

    for (const value of this.cache.values()) {
      if (now < value.expires && value.isValid) {
        validTokens++
      } else {
        expiredTokens++
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.options.maxCacheSize,
      hitRate: this.cache.size > 0 ? (validTokens / this.cache.size) * 100 : 0,
      validTokens,
      expiredTokens
    }
  }

  /**
   * Destroy the cache and cleanup
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
export const tokenCache = TokenCacheService.getInstance()