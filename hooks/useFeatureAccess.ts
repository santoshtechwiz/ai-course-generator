"use client"

import { useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useUnifiedSubscription } from './useUnifiedSubscription'
import type { SubscriptionPlanType } from '@/types/subscription'

// ============= Types =============

export type FeatureType = 
  | 'pdf-generation'
  | 'quiz-access'
  | 'course-videos'
  | 'unlimited-courses'
  | 'analytics'
  | 'export-data'

export type AccessDenialReason = 
  | 'auth' // Not authenticated
  | 'subscription' // Not subscribed or wrong plan
  | 'credits' // Insufficient credits
  | 'expired' // Subscription expired
  | null // Access granted

export interface FeatureAccess {
  canAccess: boolean
  reason: AccessDenialReason
  requiredPlan: SubscriptionPlanType | null
  currentPlan: SubscriptionPlanType
  isAuthenticated: boolean
  isSubscribed: boolean
  hasCredits: boolean
  needsUpgrade: boolean
}

// ============= Feature Requirements Configuration =============

interface FeatureRequirement {
  requiresAuth: boolean
  requiresSubscription: boolean
  minimumPlan: SubscriptionPlanType
  requiresCredits?: boolean
  description: string
}

const FEATURE_REQUIREMENTS: Record<FeatureType, FeatureRequirement> = {
  'pdf-generation': {
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'BASIC',
    requiresCredits: false,
    description: 'Generate and export PDFs'
  },
  'quiz-access': {
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'BASIC',
    requiresCredits: false,
    description: 'Access premium quizzes'
  },
  'course-videos': {
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'BASIC',
    requiresCredits: false,
    description: 'Watch all course videos'
  },
  'unlimited-courses': {
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'BASIC',
    requiresCredits: false,
    description: 'Create unlimited courses'
  },
  'analytics': {
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'PREMIUM',
    requiresCredits: false,
    description: 'View detailed analytics'
  },
  'export-data': {
    requiresAuth: true,
    requiresSubscription: true,
    minimumPlan: 'BASIC',
    requiresCredits: false,
    description: 'Export your data'
  }
}

// ============= Helper Functions =============

const PLAN_HIERARCHY: Record<SubscriptionPlanType, number> = {
  FREE: 0,
  BASIC: 1,
  PREMIUM: 2,
  ENTERPRISE: 3
}

function hasMinimumPlan(
  currentPlan: SubscriptionPlanType,
  requiredPlan: SubscriptionPlanType
): boolean {
  const currentLevel = PLAN_HIERARCHY[currentPlan] ?? 0
  const requiredLevel = PLAN_HIERARCHY[requiredPlan] ?? 0
  return currentLevel >= requiredLevel
}

// ============= Hook =============

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
    const requirement = FEATURE_REQUIREMENTS[feature]
    
    if (!requirement) {
      console.warn(`[useFeatureAccess] Unknown feature: ${feature}`)
      return {
        canAccess: false,
        reason: 'subscription' as AccessDenialReason,
        requiredPlan: 'BASIC' as SubscriptionPlanType,
        currentPlan,
        isAuthenticated,
        isSubscribed,
        hasCredits,
        needsUpgrade: true
      }
    }
    
    // Check 1: Authentication
    if (requirement.requiresAuth && !isAuthenticated) {
      return {
        canAccess: false,
        reason: 'auth' as AccessDenialReason,
        requiredPlan: requirement.minimumPlan,
        currentPlan,
        isAuthenticated,
        isSubscribed,
        hasCredits,
        needsUpgrade: false
      }
    }
    
    // Check 2: Subscription Status
    if (requirement.requiresSubscription) {
      // Check if subscription is expired
      if (isExpired) {
        return {
          canAccess: false,
          reason: 'expired' as AccessDenialReason,
          requiredPlan: requirement.minimumPlan,
          currentPlan,
          isAuthenticated,
          isSubscribed,
          hasCredits,
          needsUpgrade: true
        }
      }
      
      // Check if user has active subscription
      if (!hasActiveSubscription) {
        return {
          canAccess: false,
          reason: 'subscription' as AccessDenialReason,
          requiredPlan: requirement.minimumPlan,
          currentPlan,
          isAuthenticated,
          isSubscribed,
          hasCredits,
          needsUpgrade: true
        }
      }
      
      // Check if user has minimum required plan
      if (!hasMinimumPlan(currentPlan, requirement.minimumPlan)) {
        return {
          canAccess: false,
          reason: 'subscription' as AccessDenialReason,
          requiredPlan: requirement.minimumPlan,
          currentPlan,
          isAuthenticated,
          isSubscribed,
          hasCredits,
          needsUpgrade: true
        }
      }
    }
    
    // Check 3: Credits (if required)
    if (requirement.requiresCredits && !hasCredits) {
      return {
        canAccess: false,
        reason: 'credits' as AccessDenialReason,
        requiredPlan: requirement.minimumPlan,
        currentPlan,
        isAuthenticated,
        isSubscribed,
        hasCredits,
        needsUpgrade: false
      }
    }
    
    // All checks passed - grant access
    return {
      canAccess: true,
      reason: null,
      requiredPlan: null,
      currentPlan,
      isAuthenticated,
      isSubscribed,
      hasCredits,
      needsUpgrade: false
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
export function useCanAccessFeature(feature: FeatureType): boolean {
  const { canAccess } = useFeatureAccess(feature)
  return canAccess
}

/**
 * useRequiresUpgrade - Check if user needs to upgrade for a feature
 */
export function useRequiresUpgrade(feature: FeatureType): boolean {
  const { canAccess, reason } = useFeatureAccess(feature)
  return !canAccess && (reason === 'subscription' || reason === 'expired')
}

/**
 * useRequiresAuth - Check if user needs to sign in for a feature
 */
export function useRequiresAuth(feature: FeatureType): boolean {
  const { canAccess, reason } = useFeatureAccess(feature)
  return !canAccess && reason === 'auth'
}

// ============= Export Feature Requirements for UI =============

export { FEATURE_REQUIREMENTS }
