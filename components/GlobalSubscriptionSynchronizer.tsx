"use client"

/**
 * GlobalSubscriptionSynchronizer
 * 
 * This component is now a no-op since we use session-based auth
 * that doesn't require periodic synchronization.
 * 
 * Session data is always up-to-date and refreshed automatically
 * by NextAuth when the session changes.
 */
export function GlobalSubscriptionSynchronizer() {
  // This is a "headless" component - it doesn't render anything
  // No longer needs to sync data since we use session-only auth
  return null
}

export default GlobalSubscriptionSynchronizer
