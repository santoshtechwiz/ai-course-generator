/**
 * Production-safe logging utility
 * Only logs in development mode or when explicitly enabled
 */

const isDevelopment = process.env.NODE_ENV === 'development'
const enableProductionLogs = process.env.ENABLE_PRODUCTION_LOGS === 'true'

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (isDevelopment || enableProductionLogs) {
      console.info(`[INFO] ${message}`, ...args)
    }
  },

  warn: (message: string, ...args: unknown[]) => {
    if (isDevelopment || enableProductionLogs) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  },

  error: (message: string, ...args: unknown[]) => {
    // Always log errors, but in production send to error tracking
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, ...args)
    } else {
      // In production, send to error tracking service
      console.error(`[ERROR] ${message}`, ...args)
      // TODO: Add error tracking service integration (Sentry, etc.)
    }
  },

  debug: (message: string, ...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args)
    }
  },

  // For navigation and state debugging
  nav: (message: string, data?: Record<string, unknown>) => {
    if (isDevelopment) {
      console.log(`🛣️ [NAV] ${message}`, data)
    }
  }
}

// Export individual functions for convenience
export const { info, warn, error, debug, nav } = logger
