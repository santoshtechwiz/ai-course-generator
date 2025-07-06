"use client"

import { useSessionSubscriptionSync } from '@/hooks/useSessionSubscriptionSync'

/**
 * GlobalSubscriptionSynchronizer
 * 
 * Provides automatic session-driven subscription synchronization.
 * This component ensures subscription state stays in sync with the 
 * current session across the entire application.
 * 
 * Features:
 * - Automatic sync on session changes (login/logout/token refresh)
 * - Window focus sync for catching external changes
 * - Efficient debouncing and caching
 * - No manual polling or unnecessary API calls
 */
export function GlobalSubscriptionSynchronizer() {
  // Initialize session-driven subscription sync globally
  useSessionSubscriptionSync({
    enableAutoSync: true,
    syncOnFocus: true,
    syncOnVisibilityChange: true,
    minSyncInterval: 30000, // 30 seconds minimum between syncs
  })

  // This is a "headless" component - it doesn't render anything
  return null
}

export default GlobalSubscriptionSynchronizer
