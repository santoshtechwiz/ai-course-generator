"use client"

import React, { useEffect, useMemo } from 'react'
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription'
import { useToast } from '@/hooks'

interface SubscriptionWrapperProps {
  children: React.ReactNode
  requiredPlan?: 'FREE' | 'BASIC' | 'PREMIUM' | 'ULTIMATE'
  requireActiveSubscription?: boolean
  requireCredits?: boolean
  fallback?: React.ReactNode
  onAccessDenied?: () => void
  showUpgradePrompt?: boolean
}

/**
 * SubscriptionWrapper - A component that provides subscription-aware rendering
 * and prevents duplicate subscriptions by checking current state
 */
export default function SubscriptionWrapper({
  children,
  requiredPlan = 'FREE',
  requireActiveSubscription = false,
  requireCredits = false,
  fallback = null,
  onAccessDenied,
  showUpgradePrompt = true,
}: SubscriptionWrapperProps) {
  const { subscription, hasActiveSubscription, hasCredits, canCreateQuizOrCourse, needsUpgrade } = useUnifiedSubscription()
  const needsSubscriptionUpgrade = needsUpgrade;
  const needsCredits = !hasCredits;
  const { toast } = useToast()

  // Check if user meets all requirements
  const hasAccess = useMemo(() => {
    // Plan requirement check
    const planHierarchy: Record<string, number> = {
      FREE: 0,
      BASIC: 1,
      PREMIUM: 2,
      ULTIMATE: 3,
    }
    
    const currentPlanLevel = planHierarchy[subscription?.plan || 'FREE'] || 0
    const requiredPlanLevel = planHierarchy[requiredPlan] || 0
    const meetsPlanRequirement = currentPlanLevel >= requiredPlanLevel

    // Subscription status check
    const meetsSubscriptionRequirement = !requireActiveSubscription || hasActiveSubscription

    // Credits check
    const meetsCreditsRequirement = !requireCredits || hasCredits

    return meetsPlanRequirement && meetsSubscriptionRequirement && meetsCreditsRequirement
  }, [subscription?.plan, requiredPlan, requireActiveSubscription, hasActiveSubscription, requireCredits, hasCredits])

  // Check for duplicate subscription attempts
  const isDuplicateSubscription = useMemo(() => {
    if (requiredPlan === 'FREE') return false
    
    // Check if user is already subscribed to the same or higher plan
    const planHierarchy: Record<string, number> = {
      FREE: 0,
      BASIC: 1,
      PREMIUM: 2,
      ULTIMATE: 3,
    }
    
    const currentPlanLevel = planHierarchy[subscription?.plan || 'FREE'] || 0
    const requiredPlanLevel = planHierarchy[requiredPlan] || 0
    
    return currentPlanLevel >= requiredPlanLevel && subscription?.isSubscribed
  }, [subscription?.plan, subscription?.isSubscribed, requiredPlan])

  // Handle access denied
  useEffect(() => {
    if (!hasAccess && onAccessDenied) {
      onAccessDenied()
    }
  }, [hasAccess, onAccessDenied])

  // Show upgrade prompt if needed
  useEffect(() => {
    if (!hasAccess && showUpgradePrompt) {
      if (needsSubscriptionUpgrade) {
        toast({
          title: "Plan Upgrade Required",
          description: `This feature requires the ${requiredPlan} plan or higher.`,
          variant: "destructive",
        })
      } else if (needsCredits) {
        toast({
          title: "Insufficient Credits",
          description: "You need credits to use this feature.",
          variant: "destructive",
        })
      }
    }
  }, [hasAccess, showUpgradePrompt, needsSubscriptionUpgrade, needsCredits, requiredPlan, toast])

  // If duplicate subscription detected, show appropriate message
  if (isDuplicateSubscription) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>You are already subscribed to a plan that includes this feature.</p>
        <p className="text-sm mt-2">Current plan: {subscription?.plan}</p>
      </div>
    )
  }

  // If access denied, show fallback or upgrade prompt
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="p-6 text-center">
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground mb-4">
            {needsSubscriptionUpgrade 
              ? `This feature requires the ${requiredPlan} plan or higher.`
              : needsCredits 
                ? "You need credits to use this feature."
                : "You don't have access to this feature."
            }
          </p>
          
          {needsSubscriptionUpgrade && (
            <button
              onClick={() => window.location.href = '/dashboard/subscription'}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Upgrade Plan
            </button>
          )}
          
          {needsCredits && (
            <button
              onClick={() => window.location.href = '/dashboard/subscription'}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Get Credits
            </button>
          )}
        </div>
      </div>
    )
  }

  // User has access, render children
  return <>{children}</>
}

/**
 * Hook to check if user can access a specific feature
 * Useful for conditional rendering without the wrapper component
 */
export function useSubscriptionAccess({
  requiredPlan = 'FREE',
  requireActiveSubscription = false,
  requireCredits = false,
}: {
  requiredPlan?: 'FREE' | 'BASIC' | 'PREMIUM' | 'ULTIMATE'
  requireActiveSubscription?: boolean
  requireCredits?: boolean
} = {}) {
  const { subscription, hasActiveSubscription, hasCredits } = useUnifiedSubscription()

  return useMemo(() => {
    // Plan requirement check
    const planHierarchy: Record<string, number> = {
      FREE: 0,
      BASIC: 1,
      PREMIUM: 2,
      ULTIMATE: 3,
    }
    
    const currentPlanLevel = planHierarchy[subscription?.plan || 'FREE'] || 0
    const requiredPlanLevel = planHierarchy[requiredPlan] || 0
    const meetsPlanRequirement = currentPlanLevel >= requiredPlanLevel

    // Subscription status check
    const meetsSubscriptionRequirement = !requireActiveSubscription || hasActiveSubscription

    // Credits check
    const meetsCreditsRequirement = !requireCredits || hasCredits

    const hasAccess = meetsPlanRequirement && meetsSubscriptionRequirement && meetsCreditsRequirement

    return {
      hasAccess,
      meetsPlanRequirement,
      meetsSubscriptionRequirement,
      meetsCreditsRequirement,
      currentPlan: subscription?.plan || 'FREE',
      requiredPlan,
      needsUpgrade: !meetsPlanRequirement,
      needsCredits: !meetsCreditsRequirement,
      needsActiveSubscription: !meetsSubscriptionRequirement,
    }
  }, [subscription?.plan, requiredPlan, requireActiveSubscription, hasActiveSubscription, requireCredits, hasCredits])
}
