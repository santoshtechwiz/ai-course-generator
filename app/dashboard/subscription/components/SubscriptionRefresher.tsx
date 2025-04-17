"use client"

import { useEffect, useRef } from "react"
import useSubscriptionStore from "@/store/useSubscriptionStore"

export function SubscriptionRefresher() {
  const { refreshSubscription, clearCache } = useSubscriptionStore()
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastRefreshRef = useRef<number>(0)

  useEffect(() => {
    // Clear any existing timeout when component mounts or unmounts
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    // Initial refresh with debouncing
    const now = Date.now()
    const timeSinceLastRefresh = now - lastRefreshRef.current

    // Only refresh if it's been more than 10 seconds since last refresh
    if (timeSinceLastRefresh > 10000) {
      clearCache()
      refreshSubscription(false) // Use cached data if available
      lastRefreshRef.current = now
    }

    // Set up an interval to refresh the subscription data less frequently
    refreshTimeoutRef.current = setTimeout(() => {
      refreshSubscription(false) // Use cached data when possible

      // Set up recurring refresh at a reasonable interval
      const interval = setInterval(() => {
        // Only force refresh every 2 minutes, otherwise use cache
        const shouldForceRefresh = Date.now() - lastRefreshRef.current > 120000
        refreshSubscription(shouldForceRefresh)

        if (shouldForceRefresh) {
          lastRefreshRef.current = Date.now()
        }
      }, 60000) // Refresh every minute, but only force refresh every 2 minutes

      return () => clearInterval(interval)
    }, 30000) // Initial delay of 30 seconds

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [refreshSubscription, clearCache])

  // This is a utility component that doesn't render anything
  return null
}
