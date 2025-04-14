"use client"

import { useEffect } from "react"
import useSubscriptionStore from "@/store/useSubscriptionStore"

export function SubscriptionRefresher() {
  const { refreshSubscription, clearCache } = useSubscriptionStore()

  useEffect(() => {
    // Clear the cache and force a refresh on component mount
    clearCache()
    refreshSubscription()

    // Set up an interval to refresh the subscription data
    const interval = setInterval(() => {
      refreshSubscription()
    }, 60000) // Refresh every minute

    return () => clearInterval(interval)
  }, [refreshSubscription, clearCache])

  // This is a utility component that doesn't render anything
  return null
}
