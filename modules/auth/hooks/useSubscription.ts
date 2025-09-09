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
  clearSubscriptionError
} from '@/store/slices/subscription-slice'
import { useAuth } from '../providers/AuthProvider'

/**
 * Enhanced subscription hook with performance optimization and smart caching
 * 
 * This hook provides:
 * - Unified interface for subscription data
 * - Smart caching based on subscription status
 * - Performance-optimized selectors
 * - Automatic refresh when needed
 * - Prevents duplicate API calls
 */
export function useSubscription() {
  const dispatch = useAppDispatch()
  
  // Get session-based subscription data (always up-to-date)
  const { subscription: sessionSubscription, user, isAuthenticated } = useAuth()
  
  // Get Redux subscription data using optimized selectors
  const subscriptionData = useAppSelector(selectSubscriptionData)
  const hasActiveSubscription = useAppSelector(selectHasActiveSubscription)
  const hasCredits = useAppSelector(selectHasCredits)
  const canCreateQuizOrCourse = useAppSelector(selectCanCreateQuizOrCourse)
  const isExpired = useAppSelector(selectIsExpired)
  const shouldRefresh = useAppSelector(selectShouldRefreshSubscription)
  const cacheStatus = useAppSelector(selectSubscriptionCacheStatus)
  
  // Memoized subscription object that combines session and Redux data
  const subscription = useMemo(() => ({
    // Primary data from session (real-time)
    plan: sessionSubscription?.plan || 'FREE',
    status: sessionSubscription?.status || 'INACTIVE',
    isActive: sessionSubscription?.isActive || false,
    credits: sessionSubscription?.credits || user?.credits || 0,
    
    // Enhanced data - prefer Redux subscription data over user session data for accuracy
    tokensUsed: subscriptionData?.tokensUsed || user?.creditsUsed || 0,
    subscriptionId: subscriptionData?.subscriptionId || '',
    cancelAtPeriodEnd: subscriptionData?.cancelAtPeriodEnd || false,
    currentPeriodEnd: subscriptionData?.currentPeriodEnd || null,
    
    // Calculated properties
    isSubscribed: sessionSubscription?.isActive || false,
    isFree: (sessionSubscription?.plan || 'FREE') === 'FREE',
    isPro: (sessionSubscription?.plan || 'FREE') === 'PRO',
    isEnterprise: (sessionSubscription?.plan || 'FREE') === 'ENTERPRISE',
  }), [sessionSubscription, user, subscriptionData])
  
  // Smart refresh logic - only refresh when necessary
  const refreshSubscription = useCallback((force = false) => {
    if (force || shouldRefresh) {
      dispatch(fetchSubscription({ forceRefresh: force }))
    }
  }, [dispatch, shouldRefresh])
  
  // Clear any subscription errors
  const clearError = useCallback(() => {
    dispatch(clearSubscriptionError())
  }, [dispatch])
  
  // Auto-refresh logic with smart timing
  useEffect(() => {
    if (!isAuthenticated) return
    
    // Only fetch if we don't have data or if it's stale
    if (!subscriptionData && !shouldRefresh) {
      dispatch(fetchSubscription())
      return
    }
    
    // Refresh if data is stale and user is authenticated
    if (shouldRefresh && isAuthenticated) {
      dispatch(fetchSubscription())
    }
  }, [isAuthenticated, subscriptionData, shouldRefresh, dispatch])
  
  // Enhanced return object with business logic
  return {
    // Core subscription data
    subscription,
    
    // Business logic selectors
    hasActiveSubscription,
    hasCredits,
    canCreateQuizOrCourse,
    isExpired,
    
    // Cache and performance info
    shouldRefresh,
    cacheStatus,
    
    // Actions
    refreshSubscription,
    clearError,
    
    // Auth state
    isAuthenticated,
    user,
  }
}

/**
 * Hook for subscription-aware components that need to check permissions
 * This hook is optimized for components that only need to know if actions are allowed
 */
export function useSubscriptionPermissions() {
  const { hasActiveSubscription, hasCredits, canCreateQuizOrCourse } = useSubscription()
  
  return useMemo(() => ({
    canCreateQuiz: canCreateQuizOrCourse,
    canCreateCourse: canCreateQuizOrCourse,
    canUsePremiumFeatures: hasActiveSubscription,
    hasAvailableCredits: hasCredits,
    
    // Specific permission checks
    canGenerateContent: canCreateQuizOrCourse,
    canAccessAdvancedFeatures: hasActiveSubscription,
    needsSubscriptionUpgrade: !hasActiveSubscription,
    needsCredits: !hasCredits,
  }), [hasActiveSubscription, hasCredits, canCreateQuizOrCourse])
}

/**
 * Hook for components that need to track subscription changes
 * Useful for analytics, logging, or UI updates
 */
export function useSubscriptionTracking() {
  const { subscription, cacheStatus, shouldRefresh } = useSubscription()
  
  return useMemo(() => ({
    currentPlan: subscription.plan,
    subscriptionStatus: subscription.status,
    isActive: subscription.isActive,
    cacheStatus,
    needsRefresh: shouldRefresh,
    
    // Tracking helpers
    isPremiumUser: subscription.plan !== 'FREE',
    hasExpiredSubscription: subscription.status === 'EXPIRED',
    isInTrial: subscription.status === 'TRIAL',
  }), [subscription, cacheStatus, shouldRefresh])
}
