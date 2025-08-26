"use client"

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

// Paths that require subscription syncing
const SUBSCRIPTION_REQUIRED_PATHS = [
  '/dashboard',
  '/course',
  '/quiz',
]

export function useLazySubscriptionSync() {
  const [shouldSync, setShouldSync] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Check if current path needs subscription
    const needsSubscription = SUBSCRIPTION_REQUIRED_PATHS.some(path => 
      pathname?.startsWith(path)
    )

    if (needsSubscription && !shouldSync) {
      setShouldSync(true)
    }
  }, [pathname, shouldSync])

  return shouldSync
}
