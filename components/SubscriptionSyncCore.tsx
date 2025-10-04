"use client"

import { useEffect } from 'react'
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription'
import { useAuth } from '@/modules/auth'

/**
 * Core subscription sync functionality.
 * This is loaded dynamically only when needed.
 * 
 * Enhancements:
 * - Uses SWR for efficient caching and revalidation
 * - Directly queries database for better performance
 * - Prevents duplicate API calls with deduplication
 * - Immediate UI feedback via SWR cache updates
 */
export function SubscriptionSyncCore() {
  const { user } = useAuth()
  const { subscription, isLoading, error, refreshSubscription } = useUnifiedSubscription()
  // Subscription data is automatically cached and synchronized via SWR
  // No additional sync logic needed - SWR handles revalidation automatically
  useEffect(() => {
    if (!user?.id) return
    
    // Trigger initial subscription fetch if needed
    if (!subscription && !isLoading && !error) {
      refreshSubscription()
    }
  }, [user?.id, subscription, isLoading, error, refreshSubscription])

  return null // This component doesn't render anything
}

export default SubscriptionSyncCore
