/**
 * SubscriptionRefresher Component
 *
 * This component handles background refreshing of subscription data.
 * It doesn't render anything visible but ensures subscription data
 * stays up-to-date.
 */

"use client"

import { useEffect, useRef } from "react"
import useSubscriptionStore from "@/store/useSubscriptionStore"

export function SubscriptionRefresher() {
  const { refreshSubscription, clearCache } = useSubscriptionStore()
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const initialRefreshDoneRef = useRef(false)

  // Initial fetch on mount
  useEffect(() => {
    // Only clear cache and force refresh once on initial mount
    if (!initialRefreshDoneRef.current) {
      clearCache()
      refreshSubscription(true) // Force refresh to get real-time data
      initialRefreshDoneRef.current = true
    }

    // Set up an interval to refresh the subscription data frequently for real-time updates
    refreshIntervalRef.current = setInterval(() => {
      refreshSubscription(false) // Use the cached data if it's fresh enough
    }, 30000) // Refresh every 30 seconds to keep credit data current

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
        refreshIntervalRef.current = null
      }
    }
  }, [fetchStatus, details])

  // Refresh data periodically with debouncing
  useEffect(() => {
    const intervalId = setInterval(
      () => {
        const now = Date.now()

        // Skip if we've fetched recently or are currently refreshing
        if (now - lastFetchRef.current < 60000 || isRefreshingRef.current) {
          return
        }

        isRefreshingRef.current = true
        lastFetchRef.current = now

        fetchStatus(false).finally(() => {
          isRefreshingRef.current = false
        })
      },
      5 * 60 * 1000,
    ) // Refresh every 5 minutes

    return () => clearInterval(intervalId)
  }, [fetchStatus])

  return null
}
