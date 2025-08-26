"use client"

import { useSessionSubscriptionSync } from '@/hooks/useSessionSubscriptionSync'

/**
 * Core subscription sync functionality.
 * This is loaded dynamically only when needed.
 */
export function SubscriptionSyncCore() {
  useSessionSubscriptionSync({
    enableAutoSync: true,
    syncOnFocus: true,
    syncOnVisibilityChange: true,
    minSyncInterval: 60000, // 60 seconds
  })

  return null
}

export default SubscriptionSyncCore
