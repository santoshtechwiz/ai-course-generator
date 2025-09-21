import { Session } from "next-auth"
import { logger } from "@/lib/logger"
import { getApiUrl } from "@/utils/api-url"

interface SessionRefreshResult {
  success: boolean
  session?: Session
  error?: string
}

/**
 * SessionManager
 * Handles session lifecycle, refresh tokens, and expiration
 */
export class SessionManager {
  private static readonly TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000 // 5 minutes buffer
  private static readonly TOKEN_REFRESH_LOCK = new Set<string>()
  private static readonly SESSION_REFRESH_ATTEMPTS = new Map<string, number>()
  private static readonly MAX_REFRESH_ATTEMPTS = 3

  /**
   * Check if session needs refresh
   * @param session Current session
   */
  static needsRefresh(session: Session): boolean {
    if (!session.expires) return false

    const expiryTime = new Date(session.expires).getTime()
    const now = Date.now()
    
    return now + this.TOKEN_EXPIRY_BUFFER >= expiryTime
  }

  /**
   * Refresh session token with retry mechanism and lock to prevent parallel refreshes
   * @param userId User ID to refresh session for
   */
  static async refreshSession(userId: string): Promise<SessionRefreshResult> {
    if (this.TOKEN_REFRESH_LOCK.has(userId)) {
      logger.debug(`Session refresh already in progress for user ${userId}`)
      return { success: false, error: "Refresh already in progress" }
    }

    const attempts = this.SESSION_REFRESH_ATTEMPTS.get(userId) || 0
    if (attempts >= this.MAX_REFRESH_ATTEMPTS) {
      logger.warn(`Max refresh attempts reached for user ${userId}`)
      this.SESSION_REFRESH_ATTEMPTS.delete(userId)
      return { success: false, error: "Max refresh attempts exceeded" }
    }

    try {
      this.TOKEN_REFRESH_LOCK.add(userId)
      this.SESSION_REFRESH_ATTEMPTS.set(userId, attempts + 1)

      // Fetch new session - implementation depends on your auth setup
      const response = await fetch(getApiUrl("/api/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        throw new Error(`Failed to refresh session: ${response.statusText}`)
      }

      const newSession = await response.json()
      this.SESSION_REFRESH_ATTEMPTS.delete(userId)
      
      return { success: true, session: newSession }
    } catch (error) {
      logger.error(`Session refresh failed for user ${userId}:`, error)
      return { success: false, error: "Failed to refresh session" }
    } finally {
      this.TOKEN_REFRESH_LOCK.delete(userId)
    }
  }

  /**
   * Clear session refresh state
   * @param userId User ID to clear state for
   */
  static clearRefreshState(userId: string): void {
    this.TOKEN_REFRESH_LOCK.delete(userId)
    this.SESSION_REFRESH_ATTEMPTS.delete(userId)
  }

  /**
   * Handle session expiration
   * @param userId User ID of expired session
   */
  static async handleExpiredSession(userId: string): Promise<void> {
    logger.info(`Handling expired session for user ${userId}`)
    this.clearRefreshState(userId)
    
    // Redirect to login or show session expired message
    // Implementation depends on your frontend setup
  }
}