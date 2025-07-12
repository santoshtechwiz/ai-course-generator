"use client"

import { useMemo } from "react"
import { useAuth } from "@/modules/auth"
import { isFeatureAvailable } from "@/app/dashboard/subscription/utils/feature-utils"
import type { SubscriptionPlanType } from "@/app/types/subscription"

/**
 * Hook to check if a specific feature is available for the current user
 * 
 * @param featureKey - The feature key to check (e.g., "pdf-downloads", "priority-support")
 * @returns boolean indicating if the feature is available
 */
export function useIsFeatureAvailable(featureKey: string): boolean {
  const { subscription, user } = useAuth()
  
  return useMemo(() => {
    // Default to FREE plan if no subscription
    const currentPlan = subscription?.plan || "FREE"
    
    // Check if the feature is available for the current plan
    return isFeatureAvailable(currentPlan as SubscriptionPlanType, featureKey)
  }, [subscription?.plan, featureKey])
}

/**
 * Hook to check if the user has a specific plan level or higher
 * 
 * @param requiredPlan - The minimum required plan level
 * @returns boolean indicating if the user meets the plan requirement
 */
export function useHasPlanAccess(requiredPlan: SubscriptionPlanType): boolean {
  const { subscription } = useAuth()
  
  return useMemo(() => {
    const currentPlan = subscription?.plan || "FREE"
      // Define plan hierarchy (higher number = higher tier)
    const planLevels: Record<SubscriptionPlanType, number> = {
      FREE: 0,
      BASIC: 1,
      PREMIUM: 2,
      ULTIMATE: 3,
    }
    
    const currentLevel = planLevels[currentPlan as SubscriptionPlanType] || 0
    const requiredLevel = planLevels[requiredPlan] || 0
    
    return currentLevel >= requiredLevel
  }, [subscription?.plan, requiredPlan])
}

/**
 * Hook to get comprehensive access information
 * 
 * @param options - Configuration for access checking
 * @returns Object with access status and helper functions
 */
export function useAccessControl(options: {
  requiredPlan?: SubscriptionPlanType
  featureKey?: string
  requireAuth?: boolean
}) {
  const { user, subscription, isAuthenticated } = useAuth()
  const hasFeature = useIsFeatureAvailable(options.featureKey || "")
  const hasPlan = useHasPlanAccess(options.requiredPlan || "FREE")
  
  return useMemo(() => {
    const isAuth = isAuthenticated && !!user
    const hasAuthAccess = !options.requireAuth || isAuth
    const hasPlanAccess = !options.requiredPlan || hasPlan
    const hasFeatureAccess = !options.featureKey || hasFeature
    
    const hasAccess = hasAuthAccess && hasPlanAccess && hasFeatureAccess
    
    // Determine why access is denied
    let denialReason: string | null = null
    if (!hasAuthAccess) {
      denialReason = "authentication_required"
    } else if (!hasPlanAccess) {
      denialReason = "plan_upgrade_required"
    } else if (!hasFeatureAccess) {
      denialReason = "feature_not_available"
    }
    
    return {
      hasAccess,
      isAuthenticated: isAuth,
      hasPlanAccess: hasPlan,
      hasFeatureAccess: hasFeature,
      denialReason,
      currentPlan: subscription?.plan || "FREE",
      user,
    }
  }, [user, subscription, isAuthenticated, hasFeature, hasPlan, options])
}
