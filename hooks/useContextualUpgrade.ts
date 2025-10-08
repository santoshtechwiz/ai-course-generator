"use client"

import { useState, useCallback } from 'react'
import { UpgradeDialog } from '@/components/shared/UpgradeDialog'
import { useSessionContext } from '@/hooks/useSessionContext'
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription'
import type { SubscriptionPlanType } from '@/types/subscription-plans'

export type UpgradeTrigger = 
  | 'achievement' // After success moments
  | 'discovery' // Exploring locked features
  | 'credit_warning' // Approaching credit limit
  | 'credit_exhaustion' // Out of credits
  | 'feature_limit' // Hit feature limit
  | 'milestone' // Usage milestone reached

export interface UpgradePromptContext {
  trigger: UpgradeTrigger
  feature?: string
  achievement?: string
  customMessage?: string
}

/**
 * useContextualUpgrade Hook
 * 
 * Manages upgrade prompts with smart timing and context.
 * Respects user dismissals and prevents spam.
 */
export function useContextualUpgrade() {
  const [promptState, setPromptState] = useState<{
    open: boolean
    requiredPlan: SubscriptionPlanType
    context: UpgradePromptContext | null
  }>({
    open: false,
    requiredPlan: 'BASIC',
    context: null
  })
  
  const { shouldShowUpgradePrompt, markUpgradePromptShown, trackAchievement } = useSessionContext()
  const { plan } = useUnifiedSubscription()
  
  /**
   * Show upgrade prompt with context
   */
  const showUpgradePrompt = useCallback((
    requiredPlan: SubscriptionPlanType,
    context: UpgradePromptContext
  ) => {
    // Check if we should show based on frequency limits
    if (!shouldShowUpgradePrompt()) {
      console.log('[ContextualUpgrade] Skipping prompt - frequency limit reached')
      return false
    }
    
    // Don't show if user already has required plan or higher
    const planHierarchy: SubscriptionPlanType[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE']
    const currentPlanIndex = planHierarchy.indexOf(plan as SubscriptionPlanType)
    const requiredPlanIndex = planHierarchy.indexOf(requiredPlan)
    
    if (currentPlanIndex >= requiredPlanIndex) {
      return false
    }
    
    // Show the prompt
    setPromptState({
      open: true,
      requiredPlan,
      context
    })
    
    markUpgradePromptShown()
    return true
  }, [shouldShowUpgradePrompt, markUpgradePromptShown, plan])
  
  /**
   * Trigger upgrade prompt on achievement
   */
  const triggerAchievementUpgrade = useCallback((
    achievement: string,
    requiredPlan: SubscriptionPlanType = 'PREMIUM'
  ) => {
    trackAchievement(achievement)
    
    return showUpgradePrompt(requiredPlan, {
      trigger: 'achievement',
      achievement,
      customMessage: `Congratulations on ${achievement}! Unlock even more with ${requiredPlan}.`
    })
  }, [showUpgradePrompt, trackAchievement])
  
  /**
   * Trigger upgrade prompt on feature discovery
   */
  const triggerDiscoveryUpgrade = useCallback((
    feature: string,
    requiredPlan: SubscriptionPlanType
  ) => {
    return showUpgradePrompt(requiredPlan, {
      trigger: 'discovery',
      feature,
      customMessage: `${feature} is available in ${requiredPlan} plan.`
    })
  }, [showUpgradePrompt])
  
  /**
   * Trigger upgrade prompt on credit warning
   */
  const triggerCreditWarningUpgrade = useCallback((
    remainingCredits: number,
    totalCredits: number
  ) => {
    const percentage = (remainingCredits / totalCredits) * 100
    
    return showUpgradePrompt('PREMIUM', {
      trigger: 'credit_warning',
      customMessage: `You've used ${100 - Math.round(percentage)}% of your monthly credits. Upgrade for unlimited access!`
    })
  }, [showUpgradePrompt])
  
  /**
   * Trigger upgrade prompt on credit exhaustion
   */
  const triggerCreditExhaustionUpgrade = useCallback(() => {
    return showUpgradePrompt('PREMIUM', {
      trigger: 'credit_exhaustion',
      customMessage: "You've used all your monthly credits. Upgrade for unlimited creation!"
    })
  }, [showUpgradePrompt])
  
  /**
   * Trigger upgrade prompt on milestone
   */
  const triggerMilestoneUpgrade = useCallback((
    milestone: string,
    requiredPlan: SubscriptionPlanType = 'PREMIUM'
  ) => {
    return showUpgradePrompt(requiredPlan, {
      trigger: 'milestone',
      customMessage: `You're a power user! ${milestone}. Upgrade to ${requiredPlan} for unlimited features.`
    })
  }, [showUpgradePrompt])
  
  const closePrompt = useCallback(() => {
    setPromptState(prev => ({ ...prev, open: false }))
  }, [])
  
  return {
    // State
    promptState,
    isOpen: promptState.open,
    
    // Trigger functions
    showUpgradePrompt,
    triggerAchievementUpgrade,
    triggerDiscoveryUpgrade,
    triggerCreditWarningUpgrade,
    triggerCreditExhaustionUpgrade,
    triggerMilestoneUpgrade,
    
    // Control
    closePrompt
  }
}

/**
 * Helper function to get feature text from context
 * Use this with UpgradeDialog component
 */
export function getFeatureTextFromContext(context: UpgradePromptContext | null): string {
  if (context?.customMessage) return context.customMessage
  if (context?.feature) return context.feature
  return 'Premium features'
}
