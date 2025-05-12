"use client"

import { useEffect, useState, useCallback } from "react"
import { useAppSelector, useAppDispatch } from "@/store"
import { fetchSubscription } from "@/store/slices/subscription-slice"

const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes

export function useSubscription() {
  const dispatch = useAppDispatch()
  const subscriptionState = useAppSelector((state) => state.subscription)
  const [isInitialized, setIsInitialized] = useState(false)

  const refreshSubscription = useCallback(() => {
    dispatch(fetchSubscription())
  }, [dispatch])

  // Initialize subscription data and set up refresh interval
  useEffect(() => {
    if (!isInitialized) {
      refreshSubscription()
      setIsInitialized(true)
    }

    const interval = setInterval(refreshSubscription, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [refreshSubscription, isInitialized])

  // Calculate derived state
  const isSubscribed = subscriptionState.data?.isSubscribed ?? false
  const tokenUsage = subscriptionState.data?.tokensUsed ?? 0
  const totalTokens = subscriptionState.data?.credits ?? 0
  const remainingTokens = Math.max(totalTokens - tokenUsage, 0)
  const usagePercentage = totalTokens > 0 ? Math.min((tokenUsage / totalTokens) * 100, 100) : 0
  const hasExceededLimit = tokenUsage > totalTokens

  return {
    ...subscriptionState,
    isSubscribed,
    tokenUsage,
    totalTokens,
    remainingTokens,
    usagePercentage,
    hasExceededLimit,
    refreshSubscription,
  }
}

export default useSubscription
