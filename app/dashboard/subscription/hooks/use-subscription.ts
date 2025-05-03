"use client"

import { useCallback, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/store"
import { SubscriptionState, fetchSubscriptionStatus, fetchTokenUsage, cancelSubscription, resumeSubscription, resetSubscriptionError, clearSubscriptionData } from "@/store/slices/subscription-slice"


// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

/**
 * Custom hook for managing subscription state and actions
 */
export function useSubscription() {
  const dispatch = useAppDispatch()

  // Explicitly type the selector to avoid TypeScript errors
  const subscription = useAppSelector((state) => state.subscription as SubscriptionState)

  // Fetch subscription status with cache control
  const fetchStatus = useCallback(
    (forceRefresh = false) => {
      const shouldFetch =
        forceRefresh || !subscription.lastFetched || Date.now() - (subscription.lastFetched || 0) > CACHE_DURATION

      if (shouldFetch) {
        return dispatch(fetchSubscriptionStatus())
      }
      return Promise.resolve()
    },
    [dispatch, subscription.lastFetched],
  )

  // Fetch token usage
  const fetchTokens = useCallback(() => {
    return dispatch(fetchTokenUsage())
  }, [dispatch])

  // Cancel subscription
  const handleCancelSubscription = useCallback(() => {
    return dispatch(cancelSubscription())
  }, [dispatch])

  // Resume subscription
  const handleResumeSubscription = useCallback(() => {
    return dispatch(resumeSubscription())
  }, [dispatch])

  // Reset error
  const handleResetError = useCallback(() => {
    dispatch(resetSubscriptionError())
  }, [dispatch])

  // Clear subscription data
  const handleClearData = useCallback(() => {
    dispatch(clearSubscriptionData())
  }, [dispatch])

  // Fetch subscription status on mount
  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  return {
    subscription,
    fetchStatus,
    fetchTokens,
    cancelSubscription: handleCancelSubscription,
    resumeSubscription: handleResumeSubscription,
    resetError: handleResetError,
    clearData: handleClearData,
    isLoading: subscription.isLoading,
    error: subscription.error,
  }
}

export default useSubscription
