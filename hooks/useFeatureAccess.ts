"use client"

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useUnifiedSubscription } from './useUnifiedSubscription'
import { SubscriptionPlanType, isQuizTypeAvailable } from '@/types/subscription-plans'
import { checkFeatureAccess, type FeatureType, type AccessDenialReason, type FeatureRequirement, type FeatureAccess, FEATURE_REQUIREMENTS } from '@/lib/featureAccess'



/**
 * useFeatureAccess - Check if user can access a specific feature
 * 
 * This hook provides a centralized way to check feature access across the app.
 * It considers authentication, subscription status, plan level, and credits.
 * 
 * @param feature - The feature to check access for
 * @returns FeatureAccess object with access status and reason
 * 
 * @example
 * ```tsx
 * const { canAccess, reason, requiredPlan } = useFeatureAccess('pdf-generation')
 * 
 * if (!canAccess) {
 *   if (reason === 'auth') {
 *     return <SignInPrompt feature="pdf-generation" />
 *   }
 *   if (reason === 'subscription') {
 *     return <SubscriptionUpgrade feature="pdf-generation" requiredPlan={requiredPlan} />
 *   }
 * }
 * ```
 */
export function useFeatureAccess(feature: FeatureType): FeatureAccess {
  const { status } = useSession()
  const {
    subscription,
    isSubscribed,
    hasCredits,
    hasActiveSubscription,
    needsUpgrade,
    plan,
    isExpired
  } = useUnifiedSubscription()
  
  const isAuthenticated = status === 'authenticated'
  const currentPlan = (plan || 'FREE') as SubscriptionPlanType
  
  const access = useMemo(() => {
    // Use centralized feature access check from lib/featureAccess
    const { canAccess, isExplorable, reason, requiredPlan } = checkFeatureAccess({
      feature,
      isAuthenticated,
      isSubscribed,
      currentPlan,
      hasCredits,
      isExpired
    })
    
    // Return combined access result with additional context
    return {
      canAccess,
      isExplorable, // Always true for exploration, separate from canAccess for actions
      reason,
      requiredPlan,
      currentPlan,
      isAuthenticated,
      isSubscribed,
      hasCredits,
      needsUpgrade: reason === 'subscription' || reason === 'expired'
    }
  }, [
    feature,
    isAuthenticated,
    isSubscribed,
    hasCredits,
    hasActiveSubscription,
    needsUpgrade,
    currentPlan,
    isExpired
  ])
  
  return access
}

// ============= Convenience Hooks =============

/**
 * useCanAccessFeature - Simple boolean check for feature access
 */
function useCanAccessFeature(feature: FeatureType): boolean {
  const { canAccess } = useFeatureAccess(feature)
  return canAccess
}

/**
 * useRequiresUpgrade - Check if user needs to upgrade for a feature
 */
function useRequiresUpgrade(feature: FeatureType): boolean {
  const { canAccess, reason } = useFeatureAccess(feature)
  return !canAccess && (reason === 'subscription' || reason === 'expired')
}

/**
 * useRequiresAuth - Check if user needs to sign in for a feature
 */
function useRequiresAuth(feature: FeatureType): boolean {
  const { canAccess, reason } = useFeatureAccess(feature)
  return !canAccess && reason === 'auth'
}

// ============= Export Feature Requirements for UI =============

export { FEATURE_REQUIREMENTS }
