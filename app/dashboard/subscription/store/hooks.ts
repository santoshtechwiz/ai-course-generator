"use client"

/**
 * Custom hooks for subscription data management
 *
 * This file provides hooks that components can use to access subscription data
 * in a standardized way, leveraging the Zustand store.
 */

import { useCallback, useEffect, useMemo, useState } from "react"

import type { SubscriptionData, TokenUsage } from "../types/subscription"
import { useSubscription } from "../hooks/use-subscription"

/**
 * Custom hook to access subscription data from the Zustand store
 * with additional functionality for refreshing and tracking loading state
 */
export function useSubscriptionData({
  refreshInterval = 0,
  initialFetch = true,
}: {
  refreshInterval?: number
  initialFetch?: boolean
} = {}) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Get state from the Zustand store using individual selectors to prevent infinite loops
  // const data = useSubscriptionStore((state) => state.data)
  // const status = useSubscriptionStore((state) => state.status)
  // const error = useSubscriptionStore((state) => state.error)

  const { data, status, error, isLoading, isError } = useSubscription()

  // Memoize the subscription object to prevent recreating it on each render
  const subscription = useMemo<{
    data: SubscriptionData | null
    status: string
    error: string | null
  }>(() => ({ data, status, error }), [data, status, error])

  // Get actions from the store
  const { fetchSubscriptionStatus, fetchSubscriptionDetails, clearSubscriptionCache } = useSubscription()

  // Function to refresh data with optional force parameter
  const refreshData = useCallback(
    (force = false) => {
      setIsRefreshing(true)

      // Use Promise.all to fetch both status and details in parallel
      return Promise.all([fetchSubscriptionStatus(force), fetchSubscriptionDetails(force)])
        .catch((err) => {
          console.error("Error refreshing subscription data:", err)
        })
        .finally(() => {
          setIsRefreshing(false)
        })
    },
    [fetchSubscriptionStatus, fetchSubscriptionDetails],
  )

  // Initial fetch on mount if enabled
  useEffect(() => {
    if (initialFetch) {
      refreshData(false)
    }
  }, [initialFetch, refreshData])

  // Set up interval for periodic refreshes if specified
  useEffect(() => {
    if (refreshInterval > 0) {
      const intervalId = setInterval(() => {
        refreshData(false)
      }, refreshInterval)

      return () => clearInterval(intervalId)
    }
  }, [refreshInterval, refreshData])

  return {
    subscription,
    refreshData,
    isRefreshing,
    isLoading,
    isError,
    error,
    clearCache: clearSubscriptionCache,
  }
}

/**
 * Hook for accessing subscription plan information
 */
export function useSubscriptionPlan() {
  // Use shallow comparison to prevent unnecessary rerenders
  const { data: subscriptionData } = useSubscription()

  const isSubscribed = subscriptionData?.data?.isSubscribed || false
  const currentPlan = subscriptionData?.data?.subscriptionPlan || "FREE"
  const expirationDate = subscriptionData?.data?.expirationDate
  const cancelAtPeriodEnd = subscriptionData?.data?.cancelAtPeriodEnd || false
  const status = subscriptionData?.status || "NONE"

  return {
    isSubscribed,
    currentPlan,
    expirationDate,
    cancelAtPeriodEnd,
    status,
    isActive: status === "ACTIVE",
    isCancelled: status === "CANCELED" || cancelAtPeriodEnd,
    isPastDue: status === "PAST_DUE",
    isFree: currentPlan === "FREE",
  }
}

/**
 * Hook for accessing token usage information
 */
export function useTokenUsage(): TokenUsage {
  // Use shallow comparison to prevent unnecessary rerenders
  const { subscription: subscriptionData } = useSubscription()

  const tokensUsed = subscriptionData?.tokensUsed || 0
  const totalTokens = subscriptionData?.credits || 0

  const tokenUsagePercentage = totalTokens > 0 ? Math.min((tokensUsed / totalTokens) * 100, 100) : 0

  const hasExceededLimit = tokensUsed > 0 && tokensUsed > totalTokens

  return {
    used: tokensUsed,
    total: totalTokens,
    percentage: tokenUsagePercentage,
    hasExceededLimit,
    remaining: Math.max(totalTokens - tokensUsed, 0),
  }
}
