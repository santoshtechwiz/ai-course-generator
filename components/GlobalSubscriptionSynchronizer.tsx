"use client"

import dynamic from 'next/dynamic'
import { useLazySubscriptionSync } from '@/hooks/useLazySubscriptionSync'
import { Suspense } from 'react'
import { useAuth } from '@/modules/auth'

// Lazily load the subscription sync component
const SubscriptionSync = dynamic(
  () => import('./SubscriptionSyncCore'),
  { ssr: false }
)

/**
 * GlobalSubscriptionSynchronizer
 * 
 * Provides on-demand subscription synchronization.
 * This component ensures subscription state stays in sync with the 
 * current session, but only loads when needed.
 * 
 * Features:
 * - Lazy loading based on route
 * - Only syncs on subscription-required pages
 * - Background sync on session changes (non-blocking)
 * - Window focus sync for catching external changes
 * - Efficient debouncing and caching
 * - SWR-based caching and revalidation for improved performance
 * - Direct database queries for better efficiency
 * - Elimination of duplicate API calls
 */
export function GlobalSubscriptionSynchronizer() {
  const shouldSync = useLazySubscriptionSync()
  const { user } = useAuth()
  
  // Only sync if the user is logged in and the current route requires syncing
  if (!user?.id || !shouldSync) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <SubscriptionSync />
    </Suspense>
  )
}

export default GlobalSubscriptionSynchronizer
