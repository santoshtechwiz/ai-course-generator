"use client"

import { useSessionSubscriptionSync } from '@/hooks/useSessionSubscriptionSync'

/**
 * GlobalSubscriptionSynchronizer
 * 
 * Provides lightweight background subscription synchronization.
 * This component ensures subscription state stays in sync with the 
 * current session across the entire application.
 * 
 * Features:
 * - Background sync on session changes (non-blocking)
 * - Window focus sync for catching external changes
 * - Efficient debouncing and caching
 * - No blocking or heavy operations during initialization
 */
export function GlobalSubscriptionSynchronizer() {
  // Initialize session-driven subscription sync globally with background mode
  useSessionSubscriptionSync({
    enableAutoSync: true,
    syncOnFocus: true,
    syncOnVisibilityChange: true,
    minSyncInterval: 60000, // Increased to 60 seconds to reduce API calls
  })

  // This is a "headless" component - it doesn't render anything
  return null
}

export default GlobalSubscriptionSynchronizer
