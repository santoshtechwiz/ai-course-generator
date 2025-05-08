/**
 * SubscriptionRefresher Component
 *
 * This component handles background refreshing of subscription data.
 * It doesn't render anything visible but ensures subscription data
 * stays up-to-date.
 */

"use client"

import { useEffect, useRef } from "react"
import { useSubscription } from "../hooks/use-subscription"


export function SubscriptionRefresher() {
  const { subscription, fetchStatus, details } = useSubscription();
  const lastFetchRef = useRef<number>(0)
  const isRefreshingRef = useRef<boolean>(false)

  // Initial fetch on mount
  useEffect(() => {
    const now = Date.now()

    // Prevent multiple fetches within a short time period
    if (now - lastFetchRef.current < 10000 || isRefreshingRef.current) {
      return
    }

    isRefreshingRef.current = true
    lastFetchRef.current = now

    // Fetch data with a slight delay to prevent race conditions
    const timeoutId = setTimeout(() => {
      Promise.all([fetchStatus(false), details(false)]).finally(() => {
        isRefreshingRef.current = false
      })
    }, 100)

    // Set up event listener for subscription changes
    const handleSubscriptionChange = () => {
      const now = Date.now()

      // Prevent multiple fetches within a short time period
      if (now - lastFetchRef.current < 5000 || isRefreshingRef.current) {
        return
      }

      isRefreshingRef.current = true
      lastFetchRef.current = now

      Promise.all([fetchStatus(true), details(true)]).finally(() => {
        isRefreshingRef.current = false
      })
    }

    window.addEventListener("subscription-changed", handleSubscriptionChange)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener("subscription-changed", handleSubscriptionChange)
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
