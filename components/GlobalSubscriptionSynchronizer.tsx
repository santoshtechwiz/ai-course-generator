"use client"

import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { fetchSubscription } from '@/store/slices/subscription-slice'
import { syncSubscriptionData } from '@/store/slices/auth-slice'
import { logger } from '@/lib/logger'

/**
 * GlobalSubscriptionSynchronizer
 * 
 * This component serves as a top-level synchronizer for subscription data.
 * It ensures that subscription data is synchronized with auth state
 * when users navigate between pages or when the app is first loaded.
 * 
 * This helps prevent stale subscription data across the application.
 */
export function GlobalSubscriptionSynchronizer() {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((state) => state.auth.status === "authenticated")
  const userId = useAppSelector((state) => state.auth.user?.id)
  const lastFetched = useAppSelector((state) => state.subscription.lastFetched)
  const subscriptionData = useAppSelector((state) => state.subscription.data)
  
  // Sync subscription data with auth state on component mount
  useEffect(() => {
    if (isAuthenticated && userId) {
      const now = Date.now()
      const shouldFetch = !lastFetched || now - lastFetched > 5 * 60 * 1000 // 5 minutes
      
      // If we have subscription data and it hasn't been fetched recently, sync it to auth state
      if (subscriptionData && !shouldFetch) {
        logger.debug("Synchronizing existing subscription data with auth state")
        dispatch(syncSubscriptionData(subscriptionData))
      }
      
      // If we don't have subscription data or it's stale, fetch fresh data
      if (shouldFetch) {
        logger.debug("Fetching fresh subscription data")
        dispatch(fetchSubscription())
          .unwrap()
          .then((data) => {
            dispatch(syncSubscriptionData(data))
          })
          .catch((error) => {
            logger.error("Failed to fetch subscription data:", error)
          })
      }
    }
  }, [dispatch, isAuthenticated, userId, lastFetched, subscriptionData])
  
  // This is a "headless" component - it doesn't render anything
  return null
}

export default GlobalSubscriptionSynchronizer
