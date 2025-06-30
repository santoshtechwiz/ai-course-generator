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
  canDownloadPdfSelector,
} from "@/store/slices/subscription-slice"

import { SubscriptionResult, SubscriptionStatusType } from "@/app/types/subscription"

export type UseSubscriptionOptions = {
  allowPlanChanges?: boolean;
  allowDowngrades?: boolean;
  onSubscriptionSuccess?: (result: SubscriptionResult) => void;
  onSubscriptionError?: (error: SubscriptionResult) => void;
  skipInitialFetch?: boolean;
  canDownloadPdf?: boolean;
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

  const dispatch = useAppDispatch()
  const subscriptionData = useAppSelector(selectSubscriptionData)
  const isLoading = useAppSelector(selectSubscriptionLoading)
  const tokenUsageData = useAppSelector(selectTokenUsage)
  const isSubscribed = useAppSelector(selectIsSubscribed)
  const subscriptionPlan = useAppSelector(selectSubscriptionPlan)
  const isCancelled = useAppSelector(selectIsCancelled)
  const canDownloadPdf = useAppSelector(canDownloadPdfSelector)

  const [isInitialized, setIsInitialized] = useState(false)
  
  const refreshSubscription = useCallback(() => {
    dispatch(fetchSubscription())
      .unwrap()
      .then((result) => {
        if (result && typeof result === "object") {
          onSubscriptionSuccess?.({
            success: true,
            message: "Subscription refreshed"
          })
        }
      })
      .catch((error) => {
        onSubscriptionError?.({
          success: false,
          message: error,
          error: "REFRESH_ERROR"
        })
      })
  }, [dispatch, onSubscriptionSuccess, onSubscriptionError])
  
  useEffect(() => {
    const shouldSkipInitialFetch = skipInitialFetch || 
      (subscriptionData !== null && !isInitialized);

    if (!isInitialized && !shouldSkipInitialFetch) {
      refreshSubscription()
      setIsInitialized(true)
    }

    const interval = setInterval(refreshSubscription, REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [refreshSubscription, isInitialized, skipInitialFetch, subscriptionData])

  const {
    tokensUsed = 0,
    total: totalTokens = 0,
    remaining: remainingTokens = 0,
    percentage: usagePercentage = 0,
    hasExceededLimit = false,
  } = tokenUsageData || {}

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
        if(result.errorType==="PLAN_CHANGE_RESTRICTED"){
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
      
      // Add more business rules as needed
      return { canSubscribe: true }
    },
    [],
  )

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
    allowPlanChanges,
    allowDowngrades,
    handleSubscribe,
    canSubscribeToPlan,
    isSubscribedToAnyPaidPlan,
    isSubscribedToAllPlans,
    canDownloadPdf
  }
}

