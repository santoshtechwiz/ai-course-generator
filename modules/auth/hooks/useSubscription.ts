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
import type { SubscriptionData, SubscriptionPlanType } from '@/types/subscription'

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
  // Helper: pick canonical plan string from session or redux subscription
  const canonicalPlan = useMemo(() => {
    const p = sessionSubscription?.plan || subscriptionData?.subscriptionPlan || subscriptionData?.plan || 'FREE'
    return (String(p || 'FREE').toUpperCase()) as SubscriptionPlanType
  }, [sessionSubscription, subscriptionData])

  const subscription = useMemo(() => ({
    // Primary data from session (real-time)
    plan: canonicalPlan,
    status: sessionSubscription?.status || subscriptionData?.status || 'INACTIVE',
    isActive: Boolean(sessionSubscription?.isActive ?? (subscriptionData?.isSubscribed ?? false)),
    credits: sessionSubscription?.credits ?? subscriptionData?.credits ?? user?.credits ?? 0,
    
    // Enhanced data - prefer Redux subscription data over user session data for accuracy
    tokensUsed: subscriptionData?.tokensUsed ?? user?.creditsUsed ?? 0,
    subscriptionId: subscriptionData?.subscriptionId || '',
    cancelAtPeriodEnd: subscriptionData?.cancelAtPeriodEnd || false,
    currentPeriodEnd: subscriptionData?.expirationDate || null,
    
    // Calculated properties
    isSubscribed: Boolean(sessionSubscription?.isActive ?? subscriptionData?.isSubscribed ?? false),
    isFree: canonicalPlan === 'FREE',
    isPro: canonicalPlan === 'BASIC' || canonicalPlan === 'PREMIUM',
    isEnterprise: canonicalPlan === 'ULTIMATE',
  }), [canonicalPlan, sessionSubscription, user, subscriptionData])

  // Effective credit calculation that merges session user and redux subscription
  const effectiveCreditInfo = useMemo(() => {
    const subTotal = subscriptionData?.credits ?? 0
    const subUsed = subscriptionData?.tokensUsed ?? 0
    const userTotal = user?.credits ?? 0
    const userUsed = user?.creditsUsed ?? 0

    const remainingFromSub = Math.max(subTotal - subUsed, 0)
    const remainingFromUser = Math.max(userTotal - userUsed, 0)

    const remaining = Math.max(remainingFromSub, remainingFromUser)

    return {
      total: Math.max(subTotal, userTotal),
      used: Math.max(subUsed, userUsed),
      remaining,
      hasCredits: remaining > 0,
    }
  }, [subscriptionData, user])

  // Effective permissions merged from subscription and session data
  const effectiveCanCreate = useMemo(() => {
    return hasActiveSubscription || effectiveCreditInfo.hasCredits
  }, [hasActiveSubscription, effectiveCreditInfo])
  
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
    
    // Business logic selectors (effective values merged from session + redux)
    hasActiveSubscription,
    hasCredits: effectiveCreditInfo.hasCredits,
    canCreateQuizOrCourse: effectiveCanCreate,
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
