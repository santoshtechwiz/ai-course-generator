import { getServerSession } from "next-auth/next"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { logger } from "@/lib/logger"
import { Session } from "next-auth"
import { SessionManager } from "./session-manager"
import { SecurityService } from "./security-service"

/**
 * Centralized Authentication Service
 * Handles all authentication-related operations with proper error handling and logging
 */
export class AuthService {
  private static readonly SESSION_CACHE = new Map<string, {
    session: Session
    timestamp: number
    refreshAttempts: number
  }>()
  private static readonly CACHE_TTL = 5 * 60 * 1000 // 5 minutes
  private static readonly REFRESH_WINDOW = 60 * 1000 // 1 minute before expiry
  private static readonly MAX_REFRESH_ATTEMPTS = 3
  private static readonly CLEAN_INTERVAL = 15 * 60 * 1000 // 15 minutes

  constructor() {
    // Setup periodic cache cleanup
    setInterval(() => AuthService.clearExpiredSessions(), AuthService.CLEAN_INTERVAL)
  }

  /**
   * Verify user session and return the session if valid
   * @throws {UnauthorizedError} If session is invalid or expired
   */
  static async verifySession(): Promise<Session> {
    try {
      const session = await getServerSession(authOptions)
      
      if (!session?.user) {
        throw new UnauthorizedError("Invalid or expired session")
      }
      
      // Sanitize session data for logging
      const sanitizedSession = SecurityService.redactSensitiveData(session)
      logger.debug("Verifying session:", sanitizedSession)
      
      // If session needs refresh, attempt to refresh it
      if (SessionManager.needsRefresh(session)) {
        logger.info(`Session needs refresh for user ${SecurityService.maskSensitiveString(session.user.id)}`)
        const refreshResult = await SessionManager.refreshSession(session.user.id)
        
        if (refreshResult.success && refreshResult.session) {
          return refreshResult.session
        }
        
        logger.warn(
          `Session refresh failed for user ${SecurityService.maskSensitiveString(session.user.id)}:`,
          SecurityService.sanitizeError(refreshResult.error)
        )
      }
      
      return session
    } catch (error) {
      const secureError = SecurityService.sanitizeError(error)
      logger.error("Session verification failed:", secureError)
      throw new UnauthorizedError(secureError.message)
    }
  }

  /**
   * Get cached session if available and not expired
   * @param userId User ID to lookup cached session
   */
  static getCachedSession(userId: string): Session | null {
    const cached = this.SESSION_CACHE.get(userId)
    
    if (!cached) {
      return null
    }

    const now = Date.now()
    const sessionAge = now - cached.timestamp
    
    // If session is expired, remove it from cache
    if (sessionAge >= this.CACHE_TTL) {
      this.SESSION_CACHE.delete(userId)
      return null
    }
    
    // If session needs refresh soon, trigger background refresh
    if (sessionAge >= this.CACHE_TTL - this.REFRESH_WINDOW) {
      this.triggerBackgroundRefresh(userId, cached.session)
    }
    
    return cached.session
  }

  /**
   * Cache session for future lookups
   * @param userId User ID to cache session for
   * @param session Session to cache
   */
  static cacheSession(userId: string, session: Session): void {
    this.SESSION_CACHE.set(userId, {
      session,
      timestamp: Date.now(),
      refreshAttempts: 0
    })
  }

  /**
   * Trigger background refresh of session
   * @param userId User ID to refresh session for
   * @param currentSession Current session
   */
  private static async triggerBackgroundRefresh(userId: string, currentSession: Session): Promise<void> {
    const cached = this.SESSION_CACHE.get(userId)
    
    if (!cached) {
      return
    }

    // Check if we've exceeded max refresh attempts
    if (cached.refreshAttempts >= this.MAX_REFRESH_ATTEMPTS) {
      return
    }

    try {
      const refreshResult = await SessionManager.refreshSession(userId)
      
      if (refreshResult.success && refreshResult.session) {
        this.cacheSession(userId, refreshResult.session)
      } else {
        // Increment refresh attempts counter
        this.SESSION_CACHE.set(userId, {
          ...cached,
          refreshAttempts: cached.refreshAttempts + 1
        })
      }
    } catch (error) {
      logger.error(`Background session refresh failed for user ${SecurityService.maskSensitiveString(userId)}:`, error)
    }
  }

  /**
   * Clear expired sessions from cache
   */
  static clearExpiredSessions(): void {
    const now = Date.now()
    for (const [userId, cached] of this.SESSION_CACHE.entries()) {
      if (now - cached.timestamp >= this.CACHE_TTL) {
        this.SESSION_CACHE.delete(userId)
      }
    }
  }

  /**
   * Invalidate specific user's session cache
   * @param userId User ID to invalidate cache for
   * @param reason Optional reason for invalidation
   */
  static invalidateSessionCache(userId: string, reason?: string): void {
    const cached = this.SESSION_CACHE.get(userId)
    
    if (cached) {
      logger.info(
        `Invalidating session cache for user ${SecurityService.maskSensitiveString(userId)}${
          reason ? `: ${reason}` : ''
        }`
      )
      this.SESSION_CACHE.delete(userId)
      
      // If session was forcibly invalidated, try to clean up any background tasks
      SessionManager.clearRefreshState(userId)
    }
  }

  /**
   * Check if user has admin privileges
   * @param session User session to check
   */
  static isAdmin(session: Session): boolean {
    return session.user?.isAdmin === true
  }

  /**
   * Update user session data
   * @param userId User ID to update
   * @param data Updated user data
   */
  static async updateUserData(userId: string, data: any): Promise<boolean> {
    try {
      // Implementation would depend on your user data storage
      // This is a placeholder that should be implemented based on your needs
      logger.info(`Updating user data for ${userId}`)
      this.invalidateSessionCache(userId)
      return true
    } catch (error) {
      logger.error(`Failed to update user data for ${userId}:`, error)
      return false
    }
  }

  /**
   * Create secure unauthorized response
   * @param message Optional custom error message
   */
  static createUnauthorizedResponse(message = "Unauthorized"): NextResponse {
    const error = {
      code: "AUTHENTICATION_REQUIRED",
      message,
      timestamp: new Date().toISOString()
    }
    
    return SecurityService.createSecureErrorResponse(error)
  }
}

/**
 * Custom error for authentication failures
 */
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UnauthorizedError"
  }
}