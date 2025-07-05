"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useAuth } from "@/modules/auth"
import { SubscriptionResult, SubscriptionStatusType } from "@/app/types/subscription"

export type UseSubscriptionOptions = {
  allowPlanChanges?: boolean;
  allowDowngrades?: boolean;
  onSubscriptionSuccess?: (result: SubscriptionResult) => void;
  onSubscriptionError?: (error: SubscriptionResult) => void;
  skipInitialFetch?: boolean;
};

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

export default function useSubscription(options: UseSubscriptionOptions = {}) {
  const {
    allowPlanChanges = false,
    allowDowngrades = false,
    onSubscriptionSuccess,
    onSubscriptionError,
    skipInitialFetch = false
  } = options

  const { subscription, user, isLoading: authLoading, refreshSubscriptionData } = useAuth()
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
    // Derived values from session-based subscription
  const subscriptionData = subscription
  const isLoading = authLoading
  const isSubscribed = subscription?.plan !== "FREE" && subscription?.status === "active"
  const subscriptionPlan = subscription?.plan || "FREE"
  const isCancelled = subscription?.cancelAtPeriodEnd || false
  const canDownloadPdf = subscription?.features?.advancedAnalytics || false // Using advancedAnalytics as proxy for premium features

  const refreshSubscription = useCallback(async () => {
    try {
      if (refreshSubscriptionData) {
        await refreshSubscriptionData()
        setLastFetched(new Date())
        onSubscriptionSuccess?.({
          success: true,
          message: "Subscription refreshed"
        })
      }
    } catch (error) {
      onSubscriptionError?.({
        success: false,
        message: error instanceof Error ? error.message : "Failed to refresh subscription"
      })
    }
  }, [refreshSubscriptionData, onSubscriptionSuccess, onSubscriptionError])

  // Initialize subscription data
  useEffect(() => {
    if (!skipInitialFetch && !isInitialized && !authLoading) {
      setIsInitialized(true)
      if (subscription) {
        setLastFetched(new Date())
      }
    }
  }, [skipInitialFetch, isInitialized, authLoading, subscription])

  // Auto-refresh subscription data
  useEffect(() => {
    if (isInitialized && !skipInitialFetch) {
      const interval = setInterval(() => {
        refreshSubscription()
      }, REFRESH_INTERVAL)

      return () => clearInterval(interval)
    }
  }, [isInitialized, skipInitialFetch, refreshSubscription])
  // Credits and token management (derived from user/subscription)
  const credits = user?.credits || 0
  const tokensUsed = 0 // Not tracking tokens in current user model
  const maxTokens = subscription?.features?.maxStudySessions || 10 // Using maxStudySessions as proxy
  const remainingTokens = Math.max(0, maxTokens - tokensUsed)
  const usagePercentage = maxTokens > 0 ? (tokensUsed / maxTokens) * 100 : 0
  const hasExceededLimit = tokensUsed >= maxTokens

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

        if (result.url) {
          const successResult: SubscriptionResult = {
            success: true,
            redirectUrl: result.url,
          };
          onSubscriptionSuccess?.(successResult);
          return successResult;
        }

        const successResult: SubscriptionResult = {
          success: true,
          message: result.message || "Subscription successful",
        }

        onSubscriptionSuccess?.(successResult)
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
    [onSubscriptionSuccess, onSubscriptionError],
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

  const isSubscribedToAnyPaidPlan = useMemo(
    () => !!isSubscribed && subscriptionPlan !== "FREE",
    [isSubscribed, subscriptionPlan],
  )
  
  const isSubscribedToAllPlans = useMemo(
    () => String(subscriptionPlan) === "PREMIUM",
    [subscriptionPlan],
  )

  return {
    // Main data
    data: subscriptionData,
    subscription: subscriptionData,
    subscriptionPlan,
    isSubscribed,
    isCancelled,
    
    // Token/Credit usage
    tokenUsage: tokensUsed,
    tokensUsed,
    totalTokens: maxTokens,
    remainingTokens,
    usagePercentage,
    hasExceededLimit,
    credits,
    
    // Loading states
    isLoading,
    lastFetched,
    
    // Actions
    refreshSubscription,
    handleSubscribe,
    canSubscribeToPlan,
    
    // Feature flags
    canDownloadPdf,
    allowPlanChanges,
    allowDowngrades,
    isSubscribedToAnyPaidPlan,
    isSubscribedToAllPlans,
      // Legacy compatibility
    tokenUsageData: { tokensUsed: 0, maxTokens, remainingTokens },
  }
}

