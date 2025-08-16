"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import { useAppSelector, useAppDispatch } from "@/store"
import {
  fetchSubscription,
  selectSubscriptionData,
  selectSubscriptionLoading,
  selectTokenUsage,
  selectIsSubscribed,
  selectSubscriptionPlan,
  selectIsCancelled,
  canDownloadPdfSelector,
} from "@/store/slices/subscription-slice"

import { SubscriptionResult, SubscriptionStatusType } from "@/app/types/subscription"

export type UseSubscriptionOptimizedOptions = {
  allowPlanChanges?: boolean
  allowDowngrades?: boolean
  onSubscriptionSuccess?: (result: SubscriptionResult) => void
  onSubscriptionError?: (error: SubscriptionResult) => void
  skipInitialFetch?: boolean
  enableAutoRefresh?: boolean
  refreshInterval?: number
  forceRefreshOnMount?: boolean
}

const DEFAULT_REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes
const MIN_FETCH_INTERVAL = 30 * 1000 // 30 seconds minimum between fetches

export default function useSubscriptionOptimized(options: UseSubscriptionOptimizedOptions = {}) {
  const {
    allowPlanChanges = false,
    allowDowngrades = false,
    onSubscriptionSuccess,
    onSubscriptionError,
    skipInitialFetch = false,
    enableAutoRefresh = true,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    forceRefreshOnMount = false
  } = options

  const dispatch = useAppDispatch()
  const subscriptionData = useAppSelector(selectSubscriptionData)
  const isLoading = useAppSelector(selectSubscriptionLoading)
  const tokenUsageData = useAppSelector(selectTokenUsage)
  const isSubscribed = useAppSelector(selectIsSubscribed)
  const subscriptionPlan = useAppSelector(selectSubscriptionPlan)
  const isCancelled = useAppSelector(selectIsCancelled)
  const canDownloadPdf = useAppSelector(canDownloadPdfSelector)

  // Local state for better performance
  const [localLoading, setLocalLoading] = useState(false)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Refs for tracking state without causing re-renders
  const lastFetchTimeRef = useRef<number>(0)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Memoized values to prevent unnecessary re-renders
  const memoizedSubscriptionData = useMemo(() => subscriptionData, [subscriptionData])
  const memoizedTokenUsage = useMemo(() => tokenUsageData, [tokenUsageData])
  const memoizedIsSubscribed = useMemo(() => isSubscribed, [isSubscribed])
  const memoizedSubscriptionPlan = useMemo(() => subscriptionPlan, [subscriptionPlan])

  // Check if we need to fetch subscription data
  const shouldFetch = useCallback((force = false) => {
    const now = Date.now()
    const timeSinceLastFetch = now - lastFetchTimeRef.current
    
    // Don't fetch if:
    // 1. Too recent (unless forced)
    // 2. Already loading
    // 3. Component unmounted
    if (!force && timeSinceLastFetch < MIN_FETCH_INTERVAL) {
      return false
    }
    
    if (isLoading || localLoading) {
      return false
    }
    
    if (!isMountedRef.current) {
      return false
    }
    
    return true
  }, [isLoading, localLoading])

  // Optimized refresh function
  const refreshSubscription = useCallback(async (force = false) => {
    if (!shouldFetch(force)) {
      return
    }

    try {
      setLocalLoading(true)
      lastFetchTimeRef.current = Date.now()
      setLastFetchTime(Date.now())

      const result = await dispatch(fetchSubscription({ forceRefresh: force })).unwrap()
      
      if (result && typeof result === "object") {
        onSubscriptionSuccess?.({
          success: true,
          message: "Subscription refreshed"
        })
      }
    } catch (error) {
      console.error("Subscription refresh failed:", error)
      onSubscriptionError?.({
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        error: "REFRESH_ERROR"
      })
    } finally {
      if (isMountedRef.current) {
        setLocalLoading(false)
      }
    }
  }, [dispatch, onSubscriptionSuccess, onSubscriptionError, shouldFetch])

  // Initialize subscription data
  useEffect(() => {
    if (isInitialized) return

    const shouldSkipInitialFetch = skipInitialFetch || 
      (subscriptionData !== null && !forceRefreshOnMount)

    if (!shouldSkipInitialFetch) {
      refreshSubscription(forceRefreshOnMount)
      setIsInitialized(true)
    } else {
      setIsInitialized(true)
    }
  }, [skipInitialFetch, subscriptionData, forceRefreshOnMount, refreshSubscription, isInitialized])

  // Auto-refresh logic (only when needed)
  useEffect(() => {
    if (!enableAutoRefresh || !isInitialized) return

    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }

      refreshTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          refreshSubscription(false)
        }
      }, refreshInterval)
    }

    // Schedule next refresh
    scheduleRefresh()

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [enableAutoRefresh, refreshInterval, refreshSubscription, isInitialized])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  // Memoized subscription actions
  const handleSubscribe = useCallback(
    async (planId?: string, duration?: number): Promise<SubscriptionResult> => {
      try {
        const response = await fetch("/api/subscriptions/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, duration }),
        })

        const result = await response.json()

        if (!response.ok) {
          const errorResult: SubscriptionResult = {
            success: false,
            message: result.message || "Subscription failed",
            error: result.errorType || "UNKNOWN",
          }
          onSubscriptionError?.(errorResult)
          return errorResult
        }

        if (result.errorType === "PLAN_CHANGE_RESTRICTED") {
          const errorResult: SubscriptionResult = {
            success: false,
            message: result.message || "Plan change not allowed",
            error: "PLAN_CHANGE_RESTRICTED",
          }
          onSubscriptionError?.(errorResult)
          return errorResult
        }

        if (result.url) {
          const successResult: SubscriptionResult = {
            success: true,
            redirectUrl: result.url,
          }
          onSubscriptionSuccess?.(successResult)
          return successResult
        }

        const successResult: SubscriptionResult = {
          success: true,
          message: result.message || "Subscription successful",
        }

        onSubscriptionSuccess?.(successResult)
        
        // Refresh subscription data after successful subscription
        setTimeout(() => refreshSubscription(true), 1000)
        
        return successResult
      } catch (error: any) {
        const errorResult: SubscriptionResult = {
          success: false,
          message: error?.message || "Network error",
          error: "NETWORK",
        }
        onSubscriptionError?.(errorResult)
        return errorResult
      }
    },
    [onSubscriptionSuccess, onSubscriptionError, refreshSubscription],
  )

  const canSubscribeToPlan = useCallback(
    (currentPlan: string, targetPlan: string, status: SubscriptionStatusType | null): { 
      canSubscribe: boolean; 
      reason?: string 
    } => {
      if (currentPlan === targetPlan && status === "ACTIVE") {
        return { canSubscribe: false, reason: "You are already subscribed to this plan" }
      }
      
      return { canSubscribe: true }
    },
    [],
  )

  // Memoized computed values
  const isSubscribedToAnyPaidPlan = useMemo(
    () => !!memoizedIsSubscribed && memoizedSubscriptionPlan !== "FREE",
    [memoizedIsSubscribed, memoizedSubscriptionPlan],
  )
  
  const isSubscribedToAllPlans = useMemo(
    () => String(memoizedSubscriptionPlan) === "ENTERPRISE",
    [memoizedSubscriptionPlan],
  )

  // Extract token usage data with fallbacks
  const {
    tokensUsed = 0,
    total: totalTokens = 0,
    remaining: remainingTokens = 0,
    percentage: usagePercentage = 0,
    hasExceededLimit = false,
  } = memoizedTokenUsage || {}

  return {
    // Data
    data: memoizedSubscriptionData,
    isSubscribed: memoizedIsSubscribed,
    subscriptionPlan: memoizedSubscriptionPlan,
    isCancelled,
    canDownloadPdf,
    
    // Token usage
    tokenUsage: tokensUsed,
    totalTokens,
    remainingTokens,
    usagePercentage,
    hasExceededLimit,
    
    // Loading states
    isLoading: isLoading || localLoading,
    isInitialized,
    
    // Actions
    refreshSubscription,
    handleSubscribe,
    canSubscribeToPlan,
    
    // Computed values
    isSubscribedToAnyPaidPlan,
    isSubscribedToAllPlans,
    
    // Options
    allowPlanChanges,
    allowDowngrades,
    
    // Metadata
    lastFetchTime,
    timeSinceLastFetch: Date.now() - lastFetchTimeRef.current,
  }
}