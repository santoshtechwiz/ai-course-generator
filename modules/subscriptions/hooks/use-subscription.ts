import useSWR from 'swr'
import { useCallback, useMemo } from 'react'
// NOTE: Avoid importing server-only SubscriptionService here to prevent Prisma from bundling into client
import { useAuth } from '@/modules/auth'
import { type SubscriptionData, DEFAULT_FREE_SUBSCRIPTION } from '@/types/subscription'

// Cache durations in milliseconds
const CACHE_DURATION = {
  SUBSCRIPTION: 5 * 60 * 1000, // 5 minutes
}

/**
 * Custom hook for subscription data management using SWR
 * Provides subscription status, loading states, and refresh functions
 */
export const useSubscription = () => {
  const { user } = useAuth()
  const userId = user?.id

  const fetchSubscription = useCallback(async () => {
    if (!userId) return { ...DEFAULT_FREE_SUBSCRIPTION }
    const controller = new AbortController()
    try {
      const res = await fetch('/api/subscriptions/status', {
        method: 'GET',
        credentials: 'include',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      })
      if (!res.ok) throw new Error(`Failed to fetch subscription status (${res.status})`)
      const raw = await res.json()
      // API returns a flattened object already similar to SubscriptionData
      const normalized: any = {
        ...DEFAULT_FREE_SUBSCRIPTION,
        ...raw,
        // Ensure field name alignment
        subscriptionPlan: raw.subscriptionPlan || raw.plan || raw.currentPlan || 'FREE',
        status: raw.status || raw.subscriptionStatus || 'INACTIVE',
        credits: Math.max(0, raw.credits || 0),
        tokensUsed: Math.max(0, raw.tokensUsed || 0),
        isSubscribed: Boolean(raw.isSubscribed)
      }
      if (normalized.tokensUsed > normalized.credits) {
        // Cap tokensUsed if not truly active to avoid negative remaining
        if (normalized.subscriptionPlan === 'FREE' || normalized.status !== 'ACTIVE') {
          normalized.tokensUsed = normalized.credits
        }
      }
      return normalized as SubscriptionData
    } catch (error) {
      console.error('[useSubscription] fetch error', error)
      throw error
    }
  }, [userId])

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    userId ? ['subscription', userId] : null,
    fetchSubscription,
    {
      dedupingInterval: 10_000,
      focusThrottleInterval: 10_000,
      revalidateOnFocus: false,
      revalidateIfStale: true,
      errorRetryCount: 2,
      refreshInterval: CACHE_DURATION.SUBSCRIPTION,
      onErrorRetry: (err, _, __, revalidate, { retryCount }) => {
        if (retryCount >= 3) return
        setTimeout(() => revalidate({ retryCount }), 5000)
      }
    }
  )

  const subscription = data || DEFAULT_FREE_SUBSCRIPTION

  // Derived flags (mirroring legacy hook API for compatibility)
  const hasActiveSubscription = subscription.status === 'ACTIVE'
  const remainingCredits = Math.max(subscription.credits - subscription.tokensUsed, 0)
  const hasCredits = remainingCredits > 0
  // Business rule: previously paid & now inactive blocks creation. If persistent flag exists use it.
  // (Kept simple: if hadPreviousPaidPlan flag returned + not active => block even if credits)
  // @ts-ignore – tolerate absence of the flag in older responses
  const hadPreviousPaidPlan: boolean = !!subscription.hadPreviousPaidPlan
  const canCreateQuizOrCourse = hasActiveSubscription || (hasCredits && !(hadPreviousPaidPlan && !hasActiveSubscription))
  const isExpired = Boolean(
    subscription.expirationDate && new Date(subscription.expirationDate).getTime() < Date.now() && subscription.status !== 'ACTIVE'
  )

  // Basic cache status semantics for consumers coming from Redux slice
  const cacheStatus: 'fresh' | 'stale' | 'empty' | 'error' = error
    ? 'error'
    : isLoading
      ? 'empty'
      : isValidating
        ? 'stale'
        : 'fresh'
  const shouldRefresh = cacheStatus === 'stale'

  const refreshSubscription = useCallback(async (opts?: { force?: boolean }) => {
    try {
      if (userId) {
        const url = opts?.force ? '/api/subscriptions/status?force=1' : '/api/subscriptions/status'
        await fetch(url, { method: 'GET', credentials: 'include', cache: 'no-store' })
      }
    } catch (e) {
      // Non-fatal
    }
    return mutate()
  }, [mutate, userId])

  const forceRefresh = useCallback(async () => {
    if (!userId) return null
    await fetch('/api/subscriptions/status?force=1', { method: 'GET', credentials: 'include', cache: 'no-store' })
    const updated = await mutate()
    return updated
  }, [userId, mutate])

  const onSubscriptionChanged = useCallback(async () => {
    await new Promise(r => setTimeout(r, 200))
    return mutate()
  }, [mutate])

  const clearError = useCallback(() => {
    // SWR clears error automatically on successful revalidation; trigger mutate
    mutate()
  }, [mutate])

  return {
    // Core
    subscription,
    isLoading,
    isRefreshing: isValidating && !isLoading,
    error: error as Error | null,
    // Legacy compatibility flags
    hasActiveSubscription,
    hasCredits,
    canCreateQuizOrCourse,
    isExpired,
    shouldRefresh,
    cacheStatus,
    // Actions
    refreshSubscription,
    forceRefresh,
    onSubscriptionChanged,
    clearError,
    // Convenience
    isSubscribed: subscription.isSubscribed || hasActiveSubscription,
    isActive: hasActiveSubscription,
    planType: subscription.subscriptionPlan || 'FREE',
    expirationDate: subscription.expirationDate,
    credits: subscription.credits || 0,
    tokensUsed: subscription.tokensUsed || 0,
    remainingCredits
  }
}

// Permission-focused helper (compatibility replacement for legacy useSubscriptionPermissions)
export const useSubscriptionPermissions = () => {
  const { hasActiveSubscription, hasCredits, canCreateQuizOrCourse } = useSubscription()
  return useMemo(() => ({
    canCreateQuiz: canCreateQuizOrCourse,
    canCreateCourse: canCreateQuizOrCourse,
    canUsePremiumFeatures: hasActiveSubscription,
    hasAvailableCredits: hasCredits,
    canGenerateContent: canCreateQuizOrCourse,
    canAccessAdvancedFeatures: hasActiveSubscription,
    needsSubscriptionUpgrade: !hasActiveSubscription,
    needsCredits: !hasCredits
  }), [hasActiveSubscription, hasCredits, canCreateQuizOrCourse])
}

// Tracking helper (compatibility replacement for legacy useSubscriptionTracking)
export const useSubscriptionTracking = () => {
  const { subscription, cacheStatus, shouldRefresh } = useSubscription()
  return useMemo(() => ({
    currentPlan: subscription.subscriptionPlan,
    subscriptionStatus: subscription.status,
    isActive: subscription.status === 'ACTIVE',
    cacheStatus,
    needsRefresh: shouldRefresh,
    isPremiumUser: subscription.subscriptionPlan !== 'FREE',
    hasExpiredSubscription: subscription.status === 'EXPIRED',
    isInTrial: subscription.status === 'TRIAL'
  }), [subscription, cacheStatus, shouldRefresh])
}