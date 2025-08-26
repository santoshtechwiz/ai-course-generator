"use client"

import dynamic from 'next/dynamic'
import { useLazySubscriptionSync } from '@/hooks/useLazySubscriptionSync'
import { Suspense } from 'react'

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
 */
export function GlobalSubscriptionSynchronizer() {
  const shouldSync = useLazySubscriptionSync()

  if (!shouldSync) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <SubscriptionSync />
    </Suspense>
  )
}

export default GlobalSubscriptionSynchronizer
