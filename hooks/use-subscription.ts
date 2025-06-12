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

const REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes

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
