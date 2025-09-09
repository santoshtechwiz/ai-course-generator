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
  selectCanResubscribe,
  selectSubscriptionMessage,
  selectHadPreviousPaidPlan,
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
  const { isAuthenticated, user } = useAuth();

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

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidated, setLastValidated] = useState<number | null>(null);

  // Check if cache is stale
  const isCacheStale = useCallback(() => {
    return !lastValidated || Date.now() - lastValidated > CACHE_INVALIDATION_TIME;
  }, [lastValidated]);

  // Smart fetch that only validates when needed
  const validateSubscription = useCallback(async (force = false) => {
    if (!isAuthenticated || !user?.id) return;

    // Prevent concurrent validations
    if (isValidating && !force) return;

    setIsValidating(true);
    const controller = new AbortController(); // Prevent memory leaks
    
    try {
      await dispatch(fetchSubscription({ forceRefresh: force })).unwrap();
      setLastValidated(Date.now());
      if (onSubscriptionSuccess) {
        onSubscriptionSuccess({ success: true, message: "Subscription validated" });
      }
    } catch (error: any) {
      // Only report non-aborted errors
      if (error.name !== 'AbortError') {
        if (onSubscriptionError) {
          onSubscriptionError({ success: false, message: error.message || "Failed to validate subscription" });
        }
      }
    } finally {
      setIsValidating(false);
      controller.abort(); // Cleanup
    }
  }, [dispatch, isAuthenticated, user?.id, isValidating, onSubscriptionSuccess, onSubscriptionError]);

  // Initial validation
  useEffect(() => {
    if (skipInitialFetch || !isAuthenticated) return;

    if (lazyLoad && !validateOnMount) {
      // Lazy load - only validate when needed
      return;
    }

    validateSubscription();
  }, [lazyLoad, validateOnMount, validateSubscription, skipInitialFetch, isAuthenticated]);

  // Background refresh with proper cleanup
  useEffect(() => {
    if (skipInitialFetch || !isAuthenticated) return;

    const interval = setInterval(() => {
      if (isCacheStale()) {
        validateSubscription();
      }
    }, REFRESH_INTERVAL);

    // Cleanup interval on unmount to prevent memory leaks
    return () => {
      clearInterval(interval);
    };
  }, [skipInitialFetch, isAuthenticated, isCacheStale, validateSubscription]);

  // Plan validation helpers
  const canSubscribeToPlan = useCallback((
    currentPlan: string,
    targetPlan: string,
    status: SubscriptionStatusType | null
  ): { canSubscribe: boolean; reason?: string } => {
    // Always allow subscription for expired, inactive, or free users
    if (!status ||
        status === "EXPIRED" ||
        status === "INACTIVE" ||
        status === "NONE" ||
        currentPlan === "FREE") {
      return { canSubscribe: true };
    }

    // Allow resubscription for canceled plans
    if (status === "CANCELED") {
      return { canSubscribe: true };
    }

    if (!allowPlanChanges) {
      return { canSubscribe: false, reason: "Plan changes are not allowed" };
    }

    // Check for downgrades only for active subscriptions
    if (status === "ACTIVE" && !allowDowngrades && currentPlan > targetPlan) {
      return { canSubscribe: false, reason: "Downgrading is not allowed" };
    }

    // For active subscriptions, prevent same plan subscription
    if (status === "ACTIVE" && currentPlan === targetPlan) {
      return { canSubscribe: false, reason: "You are already subscribed to this plan" };
    }

    return { canSubscribe: true };
  }, [allowPlanChanges, allowDowngrades])

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
        if (!planId || !duration) {
          throw new Error('Plan ID and duration are required')
        }

        // Call the API route instead of directly importing the service
        const response = await fetch('/api/subscriptions/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId,
            duration,
            options: {} // Add any additional options here if needed
          })
        })

        const result = await response.json()

        if (response.ok && result.success) {
          // Handle different response types
          if (result.url) {
            // Stripe checkout URL - redirect to Stripe
            window.location.href = result.url
            return {
              success: true,
              message: "Redirecting to checkout...",
              redirectUrl: result.url
            }
          } else if (result.redirect) {
            // Internal redirect (e.g., for FREE plan)
            window.location.href = result.redirect
            return {
              success: true,
              message: result.message || "Plan activated successfully!"
            }
          } else {
            // Success without redirect
            return {
              success: true,
              message: result.message || "Subscription successful!"
            }
          }
        } else {
          throw new Error(result.error || 'Failed to process subscription')
        }
      } catch (error: any) {
        const errorMessage = error.message || "Subscription failed"
        
        if (onSubscriptionError) {
          onSubscriptionError({ success: false, message: errorMessage })
        }
        
        return {
          success: false,
          message: errorMessage
        }
      }
    },
    [onSubscriptionSuccess, onSubscriptionError, user],
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
    cacheStatus: null,
    shouldRefresh: false,
    
    // Actions
    validateSubscription,
    canSubscribeToPlan,
    
    // Permission helpers
    canCreateContent: hasActiveSubscription && hasCredits,
    needsUpgrade: !hasActiveSubscription,
    needsCredits: !hasCredits,
    
    // Enhanced expired subscription support
    canResubscribe: false,
    subscriptionMessage: null,
    hadPreviousPaidPlan: false,
    
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