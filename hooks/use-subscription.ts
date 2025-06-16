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
import type { SubscriptionPlanType, SubscriptionStatusType } from "@/app/dashboard/subscription/types/subscription"
import { useAuth } from "./use-auth"
import { useSelector } from "react-redux"
import { selectUser } from "@/store/slices/auth-slice"

const REFRESH_INTERVAL = 10 * 60 * 1000 // 10 minutes - increased to reduce API calls

// Track refresh state globally to prevent duplicate refreshes across components
let lastGlobalRefreshTime = 0;
const MIN_REFRESH_INTERVAL = 10000; // 10 seconds minimum between refreshes

type SubscriptionResult = {
  redirectUrl?: string
  message?: string
  success?: boolean
}

type UseSubscriptionOptions = {
  allowPlanChanges?: boolean
  allowDowngrades?: boolean
  onSubscriptionSuccess?: (result: SubscriptionResult) => void
  onSubscriptionError?: (error: any) => void
  skipInitialFetch?: boolean // Option to skip initial fetch for components that don't need immediate data
}

export function useSubscription(options: UseSubscriptionOptions = {}) {
  const { 
    allowPlanChanges = false, 
    allowDowngrades = false, 
    onSubscriptionSuccess, 
    onSubscriptionError,
    skipInitialFetch = false
  } = options

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
    // Check if enough time has passed since the last global refresh
    const now = Date.now();
    if (now - lastGlobalRefreshTime < MIN_REFRESH_INTERVAL) {
      return; // Skip this refresh if it's too soon
    }
    
    // Update the last refresh timestamp
    lastGlobalRefreshTime = now;
    
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
    // Skip the initial fetch if requested or if we already have data
    const shouldSkipInitialFetch = skipInitialFetch || 
                                (subscriptionData !== null && !isInitialized);
    
    if (!isInitialized && !shouldSkipInitialFetch) {
      refreshSubscription()
      setIsInitialized(true)
    }

    // Use a more efficient approach for intervals with a longer refresh time
    const interval = setInterval(refreshSubscription, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [refreshSubscription, isInitialized, skipInitialFetch, subscriptionData])

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

  // Fix the canSubscribeToPlan function to properly check plan availability
  const canSubscribeToPlan = useCallback(
    (currentPlan: string, targetPlan: string, status: SubscriptionStatusType | null): { canSubscribe: boolean; reason?: string } => {
      // Default implementation - replace with your actual logic
      if (currentPlan === targetPlan && status === "ACTIVE") {
        return { canSubscribe: false, reason: "You are already subscribed to this plan" }
      }
      return { canSubscribe: true }
    },
    [],
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
    canDownloadPDF,
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

/**
 * Hook for accessing subscription data
 *
 * This hook provides subscription status and details:
 * - isActive: whether the subscription is active
 * - plan: the current subscription plan
 * - expiresAt: when the subscription expires
 * - features: features available to the user
 * - isLoading: whether subscription data is being fetched
 * - error: any error that occurred while fetching subscription data
 */
export function useSubscriptionDetails() {
  const { userId, isAuthenticated } = useAuth()
  const reduxUser = useSelector(selectUser)
  const [subscription, setSubscription] = useState<SubscriptionDetails>({
    isActive: false,
    plan: null,
    expiresAt: null,
    features: [],
    isLoading: false,
    error: null,
  })

  useEffect(() => {
    if (!isAuthenticated || !userId) return

    const fetchSubscription = async () => {
      setSubscription((prev) => ({ ...prev, isLoading: true }))

      try {
        // Get subscription info from API
        const response = await fetch(`/api/subscription?userId=${userId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch subscription data")
        }

        const data = await response.json()

        setSubscription({
          isActive: data.isActive || false,
          plan: data.plan || null,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          features: data.features || [],
          isLoading: false,
          error: null,
        })
      } catch (error) {
        console.error("Error fetching subscription:", error)
        setSubscription((prev) => ({
          ...prev,
          isLoading: false,
          error: "Failed to load subscription details",
        }))
      }
    }

    fetchSubscription()
  }, [userId, isAuthenticated, reduxUser?.id])

  return subscription
}

export default useSubscription
