"use client"

import { useEffect, useCallback, useMemo, useState } from 'react'
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
import { SubscriptionResult, SubscriptionStatusType, SubscriptionPlanType } from "@/app/types/subscription"

// Cache invalidation time (5 minutes)
const CACHE_INVALIDATION_TIME = 5 * 60 * 1000;

// Refresh interval for background updates (10 minutes)
const REFRESH_INTERVAL = 10 * 60 * 1000;

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

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<number | null>(null);
  
  // Check if cache is stale
  const isCacheStale = useCallback(() => {
    if (!lastValidated) return true;
    return Date.now() - lastValidated > CACHE_INVALIDATION_TIME;
  }, [lastValidated]);

  // Smart fetch that only validates when needed
  const validateSubscription = useCallback(async (force = false) => {
    if (!isAuthenticated || (!force && isValidating)) return null;
    
    try {
      setIsValidating(true);
      const result = await dispatch(fetchSubscription()).unwrap();
      setLastValidated(Date.now());
      
      if (result) {
        onSubscriptionSuccess?.({
          success: true,
          message: "Subscription validated"
        });
      }
      
      return result;
    } catch (err: any) {
      onSubscriptionError?.({
        success: false,
        message: err.message || "Failed to validate subscription"
      });
      
      toast({
        title: "Subscription Check Failed",
        description: "Unable to validate your subscription status. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsValidating(false);
    }
  }, [dispatch, isAuthenticated, isValidating, onSubscriptionSuccess, onSubscriptionError, toast]);

  // Initial validation
  useEffect(() => {
    if (!lazyLoad && validateOnMount && !lastValidated) {
      validateSubscription();
    }
  }, [lazyLoad, validateOnMount, lastValidated, validateSubscription]);

  // Background refresh
  useEffect(() => {
    if (skipInitialFetch || !isAuthenticated) return;

    const interval = setInterval(() => {
      if (!isValidating && isCacheStale()) {
        validateSubscription();
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [skipInitialFetch, isAuthenticated, isValidating, isCacheStale, validateSubscription]);

  // Plan validation helpers
  const canSubscribeToPlan = useCallback((
    currentPlan: string,
    targetPlan: string,
    status: SubscriptionStatusType | null
  ): { canSubscribe: boolean; reason?: string } => {
    if (!allowPlanChanges) {
      return { canSubscribe: false, reason: "Plan changes are not allowed" };
    }

    if (!allowDowngrades && currentPlan > targetPlan) {
      return { canSubscribe: false, reason: "Downgrading is not allowed" };
    }

    if (status === "CANCELED") {
      return { canSubscribe: false, reason: "Cannot change plan while cancelled" };
    }

    return { canSubscribe: true };
  }, [allowPlanChanges, allowDowngrades]);

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
    // Core subscription data
    subscription: subscriptionData,
    isLoading,
    tokenUsage: tokenUsageData,
    isSubscribed,
    subscriptionPlan,
    isCancelled,
    canDownloadPdf,
    hasActiveSubscription,
    hasCredits,
    canCreateQuizOrCourse,
    isExpired,
    
    // Cache and validation
    isValidating,
    lastValidated,
    isCacheStale: isCacheStale(),
    cacheStatus,
    shouldRefresh,
    
    // Actions
    validateSubscription,
    canSubscribeToPlan,
    
    // Permission helpers
    canCreateContent: hasActiveSubscription && hasCredits,
    needsUpgrade: !hasActiveSubscription,
    needsCredits: !hasCredits,
    
    // Legacy support
    data: subscriptionData,
    totalTokens,
    remainingTokens,
    usagePercentage,
    hasExceededLimit,
    allowPlanChanges,
    allowDowngrades,
    handleSubscribe,
    isSubscribedToAnyPaidPlan,
    isSubscribedToAllPlans,
  };
}

/**
 * Hook for protected actions that require subscription validation
 */
export function useProtectedAction() {
  const { validateSubscription, hasActiveSubscription, hasCredits, isValidating, isCacheStale } = useSubscription();
  const { toast } = useToast();

  const executeProtectedAction = async <T,>(
    action: () => Promise<T>,
    options: {
      requireSubscription?: boolean;
      requireCredits?: boolean;
      validateFirst?: boolean;
    } = {}
  ): Promise<T | null> => {
    const { 
      requireSubscription = true, 
      requireCredits = true,
      validateFirst = true 
    } = options;

    try {
      // Validate subscription if cache is stale or forced
      if ((isCacheStale || validateFirst) && !isValidating) {
        await validateSubscription(true);
      }

      // Check subscription requirements
      if (requireSubscription && !hasActiveSubscription) {
        toast({
          title: "Subscription Required",
          description: "Please upgrade your subscription to access this feature.",
          variant: "destructive"
        });
        return null;
      }

      // Check credits
      if (requireCredits && !hasCredits) {
        toast({
          title: "Insufficient Credits",
          description: "You don't have enough credits for this action.",
          variant: "destructive"
        });
        return null;
      }

      // Execute the protected action
      return await action();
    } catch (error: any) {
      toast({
        title: "Action Failed",
        description: error.message || "An error occurred while performing this action.",
        variant: "destructive"
      });
      return null;
    }
  };

  return {
    executeProtectedAction,
    isValidating,
    hasActiveSubscription,
    hasCredits
  };
}

/**
 * Hook for components that need to check permissions
 */
export function useSubscriptionPermissions() {
  const { 
    hasActiveSubscription, 
    hasCredits, 
    canCreateQuizOrCourse,
    validateSubscription,
    isCacheStale
  } = useSubscription({ lazyLoad: true });
  
  return useMemo(() => ({
    canCreateQuiz: canCreateQuizOrCourse,
    canCreateCourse: canCreateQuizOrCourse,
    canUsePremiumFeatures: hasActiveSubscription,
    hasAvailableCredits: hasCredits,
    validateSubscription,
    isCacheStale,
    
    // Specific permission checks
    canGenerateContent: canCreateQuizOrCourse,
    canAccessAdvancedFeatures: hasActiveSubscription,
    needsSubscriptionUpgrade: !hasActiveSubscription,
    needsCredits: !hasCredits,
  }), [
    hasActiveSubscription, 
    hasCredits, 
    canCreateQuizOrCourse,
    validateSubscription,
    isCacheStale
  ]);
}