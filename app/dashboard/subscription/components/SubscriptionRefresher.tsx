/**
 * SubscriptionRefresher Component
 *
 * This component handles background refreshing of subscription data.
 * It doesn't render anything visible but ensures subscription data
 * stays up-to-date.
 */

"use client"

import { useEffect, useRef } from "react"
import { useAppDispatch, useAppSelector } from "@/store"
import { fetchSubscription } from "@/store/slices/subscription-slice"

export function SubscriptionRefresher() {
  const dispatch = useAppDispatch()
  const lastFetched = useAppSelector((state) => state.subscription.lastFetched)
  const isLoading = useAppSelector((state) => state.subscription.isLoading)
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const initialRefreshDoneRef = useRef(false)

  // Initial fetch on mount
  useEffect(() => {
    // Only force refresh once on initial mount
    if (!initialRefreshDoneRef.current) {
      dispatch(fetchSubscription())
      initialRefreshDoneRef.current = true
    }

    // Set up an interval to refresh the subscription data
    refreshIntervalRef.current = setInterval(() => {
      // Don't refresh if already loading or if we've fetched recently (within 30 seconds)
      if (!isLoading && (!lastFetched || Date.now() - lastFetched > 30000)) {
        dispatch(fetchSubscription())
      }
    }, 30000) // Refresh every 30 seconds to keep credit data current

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
    }
  }, [dispatch, lastFetched, isLoading])

  return null
}

export default SubscriptionRefresher
