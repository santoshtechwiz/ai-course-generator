"use client"

import { useEffect } from 'react'
import { useSubscription } from '@/modules/subscriptions/client'
import { useAppDispatch } from '@/store/hooks'
import { useAuth } from '@/modules/auth'
import { useSessionSubscriptionSync } from '@/hooks/useSessionSubscriptionSync'
import { setSubscriptionData } from '@/store/slices/subscription-slice'

/**
 * Core subscription sync functionality.
 * This is loaded dynamically only when needed.
 * 
 * Enhancements:
 * - Uses SWR for efficient caching and revalidation
 * - Directly queries database for better performance
 * - Prevents duplicate API calls with deduplication
 * - Immediate UI feedback via Redux state updates
 */
export function SubscriptionSyncCore() {
  const dispatch = useAppDispatch()
  const { user } = useAuth()
  const { subscription, isLoading, error } = useSubscription()

  // Legacy sync for backwards compatibility
  useSessionSubscriptionSync({
    enableAutoSync: false, // Disable legacy auto sync
    syncOnFocus: false,    // We'll handle this with SWR
    syncOnVisibilityChange: false,
    minSyncInterval: 300000, // 5 minutes as backup
  })

  // Sync subscription data to Redux store whenever it changes
  useEffect(() => {
    if (!user?.id || isLoading || error) return
    
    // Only update if we have valid subscription data
    if (subscription) {
      dispatch(setSubscriptionData(subscription))
    }
  }, [subscription, isLoading, error, dispatch, user?.id])

  return null // This component doesn't render anything
}

export default SubscriptionSyncCore
