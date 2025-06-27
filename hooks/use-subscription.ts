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
import type { SubscriptionStatusType, SubscriptionDetails } from "@/types/shared-types"
import { useAuth } from "./use-auth"
import { useSelector } from "react-redux"
import { selectUser } from "@/store/slices/auth-slice"

// Add missing UseSubscriptionOptions type
export type UseSubscriptionOptions = {
  allowPlanChanges?: boolean;
  allowDowngrades?: boolean;
  onSubscriptionSuccess?: (result: any) => void;
  onSubscriptionError?: (error: any) => void;
  skipInitialFetch?: boolean;
};

const REFRESH_INTERVAL = 10 * 60 * 1000 // 10 minutes - increased to reduce API calls

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

  const [isInitialized, setIsInitialized] = useState(false)
  const refreshSubscription = useCallback(() => {
    // Remove local debounce logic; rely on Redux slice for duplicate prevention
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
    () => !!isSubscribed && subscriptionPlan !== "FREE",
    [isSubscribed, subscriptionPlan],
  )
  const isSubscribedToAllPlans = useMemo(
    () => String(subscriptionPlan) === "ENTERPRISE",
    [subscriptionPlan],
  )

  return {
    data: subscriptionData,
    isSubscribed,
    tokenUsage: tokensUsed,
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
  const { isAuthenticated } = useAuth()
  const reduxUser = useSelector(selectUser)
  const userId = reduxUser?.id
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !userId) return

    const fetchSubscription = async () => {
      setSubscription((prev) => prev ? { ...prev, isLoading: true } : { isLoading: true } as any)

      try {
        // Get subscription info from API
        const response = await fetch(`/api/subscription?userId=${userId}`)

        if (!response.ok) {
          throw new Error("Failed to fetch subscription data")
        }

        const data = await response.json()

        setSubscription({
          ...data,
          isLoading: false,
          error: null,
        })
      } catch (error) {
        console.error("Error fetching subscription:", error)
        setSubscription((prev) => prev ? { ...prev, isLoading: false, error: "Failed to load subscription details" } : { isLoading: false, error: "Failed to load subscription details" } as any)
      }
    }

    fetchSubscription()
  }, [userId, isAuthenticated, reduxUser?.id])

  return subscription
}

export default useSubscription
