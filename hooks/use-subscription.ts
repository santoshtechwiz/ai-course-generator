"use client"

import { useEffect, useState, useCallback } from "react"
import { useAppSelector, useAppDispatch } from "@/store"
import { fetchSubscription } from "@/store/slices/subscription-slice"

const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes
// fix onSubscriptionSuccess
type UseSubscriptionOptions = {
  allowPlanChanges?: boolean
  allowDowngrades?: boolean
  onSubscriptionSuccess?: (result?: { redirectUrl?: string; message?: string }) => void
  onSubscriptionError?: (error: any) => void
}

export function useSubscription(options: UseSubscriptionOptions = {}) {
  const {
    allowPlanChanges = false,
    allowDowngrades = false,
    onSubscriptionSuccess,
    onSubscriptionError,
  } = options

  const dispatch = useAppDispatch()
  const subscriptionState = useAppSelector((state) => state.subscription)
  const [isInitialized, setIsInitialized] = useState(false)

  const refreshSubscription = useCallback(() => {
    dispatch(fetchSubscription())
      .unwrap()
      .then((result) => {
        if (result && typeof result === "object") {
          onSubscriptionSuccess?.(result)
        }
      })
      .catch((error) => {
        onSubscriptionError?.(error)
      })
  }, [dispatch, onSubscriptionSuccess, onSubscriptionError])

  useEffect(() => {
    if (!isInitialized) {
      refreshSubscription()
      setIsInitialized(true)
    }

    const interval = setInterval(refreshSubscription, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [refreshSubscription, isInitialized])

  // Derived subscription values
  const isSubscribed = subscriptionState.data?.isSubscribed ?? false
  const tokenUsage = subscriptionState.data?.tokensUsed ?? 0
  const totalTokens = subscriptionState.data?.credits ?? 0
  const remainingTokens = Math.max(totalTokens - tokenUsage, 0)
  const usagePercentage = totalTokens > 0 ? Math.min((tokenUsage / totalTokens) * 100, 100) : 0
  const hasExceededLimit = tokenUsage > totalTokens
  const isLoading = subscriptionState.loading ?? false

  // === Custom callbacks and helpers ===

  const handleSubscribe = useCallback(async (planId?: string) => {
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ planId }),
      })

      const result = await response.json()

      if (result.redirectUrl) {
        window.location.href = result.redirectUrl
      } else {
        onSubscriptionSuccess?.(result)
      }
    } catch (error: any) {
      onSubscriptionError?.(error)
    }
  }, [onSubscriptionSuccess, onSubscriptionError])

  const canSubscribeToPlan = useCallback((planId: string) => {
    return subscriptionState.data?.planId !== planId
  }, [subscriptionState.data?.planId])

  const isSubscribedToAnyPaidPlan = !!subscriptionState.data?.isSubscribed && !!subscriptionState.data?.isPaidPlan
  const isSubscribedToAllPlans = subscriptionState.data?.isEnterprise ?? false

  return {
    ...subscriptionState,
    isSubscribed,
    tokenUsage,
    totalTokens,
    remainingTokens,
    usagePercentage,
    hasExceededLimit,
    isLoading,
    refreshSubscription,
    onSubscriptionSuccess,

    // Config flags
    allowPlanChanges,
    allowDowngrades,

    // Callbacks
    handleSubscribe,
    canSubscribeToPlan,
    isSubscribedToAnyPaidPlan,
    isSubscribedToAllPlans,
  }
}

export default useSubscription
