"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useAppSelector, useAppDispatch } from "@/store"
import {
  fetchSubscription,
  selectSubscriptionData,
  selectSubscriptionLoading,
  selectTokenUsage,
  selectIsSubscribed,
  selectSubscriptionPlan,
  selectIsCancelled,
} from "@/store/slices/subscription-slice"

const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes

type UseSubscriptionOptions = {
  allowPlanChanges?: boolean
  allowDowngrades?: boolean
  onSubscriptionSuccess?: (result?: { redirectUrl?: string; message?: string }) => void
  onSubscriptionError?: (error: any) => void
}

export function useSubscription(options: UseSubscriptionOptions = {}) {
  const { allowPlanChanges = false, allowDowngrades = false, onSubscriptionSuccess, onSubscriptionError } = options

  const dispatch = useAppDispatch()

  // Use memoized selectors for better performance
  const subscriptionData = useAppSelector(selectSubscriptionData)
  const isLoading = useAppSelector(selectSubscriptionLoading)
  const tokenUsageData = useAppSelector(selectTokenUsage)
  const isSubscribed = useAppSelector(selectIsSubscribed)
  const subscriptionPlan = useAppSelector(selectSubscriptionPlan)
  const isCancelled = useAppSelector(selectIsCancelled)
  const canDownloadPDF = useAppSelector((state) => state.subscription.data?.canDownloadPDF)

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

  // Derive values from tokenUsageData to avoid recalculations
  const {
    tokensUsed = 0,
    total: totalTokens = 0,
    remaining: remainingTokens = 0,
    percentage: usagePercentage = 0,
    hasExceededLimit = false,
  } = tokenUsageData || {}

  // Memoize callbacks to prevent unnecessary re-renders
  const handleSubscribe = useCallback(
    async (planId?: string) => {
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
    },
    [onSubscriptionSuccess, onSubscriptionError],
  )

  const canSubscribeToPlan = useCallback(
    (planId: string) => {
      return subscriptionData?.planId !== planId
    },
    [subscriptionData?.planId],
  )

  // Memoize derived values
  const isSubscribedToAnyPaidPlan = useMemo(
    () => !!isSubscribed && !!subscriptionData?.isPaidPlan,
    [isSubscribed, subscriptionData?.isPaidPlan],
  )

  const isSubscribedToAllPlans = useMemo(
    () => subscriptionData?.isEnterprise ?? false,
    [subscriptionData?.isEnterprise],
  )

  return {
    data: subscriptionData,
    isSubscribed,
    tokenUsage: tokensUsed,
    canDownloadPDF,
    totalTokens,
    remainingTokens,
    usagePercentage,
    hasExceededLimit,
    isLoading,
    refreshSubscription,
    onSubscriptionSuccess,
    subscriptionPlan,
    isCancelled,

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
