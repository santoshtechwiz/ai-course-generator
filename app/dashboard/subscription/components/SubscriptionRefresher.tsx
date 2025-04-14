"use client"

import { useEffect } from "react"
import useSubscriptionStore from "@/store/useSubscriptionStore"

export function SubscriptionRefresher() {
  const { refreshSubscription, clearCache } = useSubscriptionStore()

  useEffect(() => {
    // Immediately clear cache and force a refresh on component mount
    // This ensures we get fresh credit data right away
    clearCache()
    refreshSubscription(true) // Force refresh to get real-time data

    // Set up an interval to refresh the subscription data frequently for real-time updates
    const interval = setInterval(() => {
      refreshSubscription(true) // Always force refresh to get real-time credit data
    }, 30000) // Refresh every 30 seconds to keep credit data current

    return () => {
      clearInterval(interval)
    }
  }, [refreshSubscription, clearCache])

  // This is a utility component that doesn't render anything
  return null
}
