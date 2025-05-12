"use client"

/**
 * @deprecated Use hooks/use-subscription.ts instead
 * This file is maintained for backwards compatibility
 */

import { useEffect } from "react"
import { useAppSelector, useAppDispatch } from "@/store"
import {
  fetchSubscription,
  selectSubscription,
  selectSubscriptionLoading,
  selectSubscriptionError,
} from "@/store/slices/subscription-slice"

export function useSubscriptionData({
  refreshInterval = 0,
  initialFetch = true,
}: {
  refreshInterval?: number
  initialFetch?: boolean
} = {}) {
  const dispatch = useAppDispatch()
  const subscription = useAppSelector(selectSubscription)
  const isLoading = useAppSelector(selectSubscriptionLoading)
  const error = useAppSelector(selectSubscriptionError)

  // Initial fetch
  useEffect(() => {
    if (initialFetch) {
      dispatch(fetchSubscription())
    }
  }, [dispatch, initialFetch])

  // Periodic refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      const intervalId = setInterval(() => {
        dispatch(fetchSubscription())
      }, refreshInterval)

      return () => clearInterval(intervalId)
    }
  }, [dispatch, refreshInterval])

  return {
    subscription: { data: subscription, status: subscription?.status || "NONE", error },
    refreshData: () => dispatch(fetchSubscription()),
    isLoading,
    isError: !!error,
    error,
  }
}

export function useSubscriptionPlan() {
  const subscription = useAppSelector(selectSubscription)

  if (!subscription) {
    return {
      isSubscribed: false,
      currentPlan: "FREE",
      status: "NONE",
      isActive: false,
      isCancelled: false,
      isPastDue: false,
      isFree: true,
    }
  }

  const isActive = subscription.status === "ACTIVE"

  return {
    isSubscribed: subscription.isSubscribed,
    currentPlan: subscription.subscriptionPlan,
    expirationDate: subscription.expirationDate,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    status: subscription.status,
    isActive,
    isCancelled: subscription.status === "CANCELED" || subscription.cancelAtPeriodEnd,
    isPastDue: subscription.status === "PAST_DUE",
    isFree: subscription.subscriptionPlan === "FREE",
  }
}

export function useTokenUsage() {
  const subscription = useAppSelector(selectSubscription)

  const tokensUsed = subscription?.tokensUsed || 0
  const totalTokens = subscription?.credits || 0
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
