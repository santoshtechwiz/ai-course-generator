"use client"

import { useCallback, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/store"
import {
  type SubscriptionState,
  fetchSubscriptionStatus,
  fetchTokenUsage,
  cancelSubscription,
  resumeSubscription,
  resetSubscriptionError,
  clearSubscriptionData,
} from "@/store/slices/subscription-slice"

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

// Default empty subscription state
const emptySubscriptionState: SubscriptionState = {
  data: null,
  details: null,
  tokenUsage: null,
  isLoading: false,
  error: null,
  lastFetched: null,
}

/**
 * Custom hook for managing subscription state and actions
 */
export function useSubscription() {
  const dispatch = useAppDispatch()

  // Safely access subscription state with fallback to empty state
  const subscription = useAppSelector((state) =>
    "subscription" in state ? (state.subscription as SubscriptionState) : emptySubscriptionState,
  )

  const { isAuthenticated } = useAppSelector((state) => state.auth)

  // Fetch subscription status with cache control
  const fetchStatus = useCallback(
    (forceRefresh = false) => {
      const shouldFetch =
        forceRefresh || !subscription?.lastFetched || Date.now() - (subscription?.lastFetched || 0) > CACHE_DURATION

      if (shouldFetch && isAuthenticated) {
        return dispatch(fetchSubscriptionStatus())
      }
      return Promise.resolve()
    },
    [dispatch, subscription?.lastFetched, isAuthenticated],
  )

  // Fetch token usage
  const fetchTokens = useCallback(() => {
    if (isAuthenticated) {
      return dispatch(fetchTokenUsage())
    }
    return Promise.resolve()
  }, [dispatch, isAuthenticated])

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

  // Fetch subscription status on mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchStatus()
    }
  }, [fetchStatus, isAuthenticated])

  return {
    subscription: subscription.data,
    details: subscription.details,
    tokenUsage: subscription.tokenUsage,
    isLoading: subscription.isLoading,
    error: subscription.error,
    lastFetched: subscription.lastFetched,
    fetchStatus,
    fetchTokens,
    cancelSubscription: handleCancelSubscription,
    resumeSubscription: handleResumeSubscription,
    resetError: handleResetError,
    clearData: handleClearData,
  }
}
