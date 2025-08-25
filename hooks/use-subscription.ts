"use client"

import { useEffect, useCallback, useMemo } from 'react'
import { useAppSelector, useAppDispatch } from '@/store'
import { 
  selectSubscriptionData,
  selectHasActiveSubscription,
  selectHasCredits,
  selectCanCreateQuizOrCourse,
  selectIsExpired,
  selectShouldRefreshSubscription,
  selectSubscriptionCacheStatus,
  fetchSubscription,
  markSubscriptionStale,
  clearSubscriptionError,
  selectSubscriptionLoading,
  selectTokenUsage,
  selectIsSubscribed,
  selectSubscriptionPlan,
  selectIsCancelled,
  canDownloadPdfSelector,
} from '@/store/slices/subscription-slice'
import { useAuth } from '@/modules/auth/providers/AuthProvider'
import { useToast } from '@/hooks'
import { SubscriptionResult } from "@/app/types/subscription"

export type UseSubscriptionOptions = {
  allowPlanChanges?: boolean;
  allowDowngrades?: boolean;
  onSubscriptionSuccess?: (result: SubscriptionResult) => void;
  onSubscriptionError?: (error: SubscriptionResult) => void;
  skipInitialFetch?: boolean;
  lazyLoad?: boolean;
  validateOnMount?: boolean;
};

export default function useSubscription(options: UseSubscriptionOptions = {}) {
  const {
    allowPlanChanges = false,
    allowDowngrades = false,
    onSubscriptionSuccess,
    onSubscriptionError,
    skipInitialFetch = false,
    lazyLoad = true,
    validateOnMount = false
  } = options;

  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  // Redux selectors
  const subscriptionData = useAppSelector(selectSubscriptionData);
  const isLoading = useAppSelector(selectSubscriptionLoading);
  const tokenUsageData = useAppSelector(selectTokenUsage);
  const isSubscribed = useAppSelector(selectIsSubscribed);
  const subscriptionPlan = useAppSelector(selectSubscriptionPlan);
  const isCancelled = useAppSelector(selectIsCancelled);
  const canDownloadPdf = useAppSelector(canDownloadPdfSelector);
  const hasActiveSubscription = useAppSelector(selectHasActiveSubscription);
  const hasCredits = useAppSelector(selectHasCredits);
  const canCreateQuizOrCourse = useAppSelector(selectCanCreateQuizOrCourse);
  const isExpired = useAppSelector(selectIsExpired);
  const shouldRefresh = useAppSelector(selectShouldRefreshSubscription);
  const cacheStatus = useAppSelector(selectSubscriptionCacheStatus);

  // Validate subscription status
  const validateSubscription = useCallback(async () => {
    if (!isAuthenticated) return null;
    
    try {
      const result = await dispatch(fetchSubscription()).unwrap();
      
      if (result) {
        onSubscriptionSuccess?.({
          success: true,
          message: "Subscription validated"
        });
      }
      
      return result;
    } catch (error: any) {
      onSubscriptionError?.({
        success: false,
        message: error.message || "Failed to validate subscription"
      });
      
      toast({
        title: "Subscription Check Failed",
        description: "Unable to validate your subscription status. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  }, [dispatch, isAuthenticated, onSubscriptionSuccess, onSubscriptionError, toast]);

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
        // Implement subscription logic here
        return {
          success: true,
          message: "Subscription successful"
        };
      } catch (error: any) {
        return {
          success: false,
          message: error.message || "Subscription failed"
        };
      }
    },
    [onSubscriptionSuccess, onSubscriptionError],
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
    validateSubscription,
    subscriptionPlan,
    isCancelled,
    allowPlanChanges,
    allowDowngrades,
    handleSubscribe,
    isSubscribedToAnyPaidPlan,
    isSubscribedToAllPlans,
    canDownloadPdf,
    hasActiveSubscription,
    hasCredits,
    canCreateQuizOrCourse,
    isExpired,
    cacheStatus,
    shouldRefresh
  }
}
