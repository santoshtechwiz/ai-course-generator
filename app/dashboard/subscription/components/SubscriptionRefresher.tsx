"use client"

import { useEffect, useRef } from "react"
import useSubscriptionStore from "@/store/useSubscriptionStore"

export function SubscriptionRefresher() {
  const { refreshSubscription, clearCache } = useSubscriptionStore()
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const initialRefreshDoneRef = useRef(false)

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
  }, [refreshSubscription, clearCache])

  // This is a utility component that doesn't render anything
  return null
}
