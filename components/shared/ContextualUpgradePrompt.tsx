"use client"

import { UpgradeDialog } from '@/components/shared/UpgradeDialog'
import { getFeatureTextFromContext, type UpgradeTrigger } from '@/hooks/useContextualUpgrade'
import type { SubscriptionPlanType } from '@/types/subscription-plans'

interface UpgradePromptContext {
  trigger: UpgradeTrigger
  feature?: string
  achievement?: string
  customMessage?: string
}

interface ContextualUpgradePromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requiredPlan: SubscriptionPlanType
  context: UpgradePromptContext | null
  currentPlan?: string
}

/**
 * ContextualUpgradePrompt Component
 * 
 * Wrapper around UpgradeDialog that adds contextual messaging
 * based on the trigger type and user's action.
 * 
 * @example
 * ```tsx
 * const { promptState, closePrompt } = useContextualUpgrade()
 * 
 * <ContextualUpgradePrompt
 *   open={promptState.open}
 *   onOpenChange={closePrompt}
 *   requiredPlan={promptState.requiredPlan}
 *   context={promptState.context}
 * />
 * ```
 */
export function ContextualUpgradePrompt({
  open,
  onOpenChange,
  requiredPlan,
  context,
  currentPlan
}: ContextualUpgradePromptProps) {
  const featureText = getFeatureTextFromContext(context)
  
  return (
    <UpgradeDialog
      open={open}
      onOpenChange={onOpenChange}
      requiredPlan={requiredPlan}
      currentPlan={currentPlan}
      feature={featureText}
    />
  )
}
