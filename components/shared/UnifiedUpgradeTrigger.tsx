"use client";

import { useEffect } from "react";
import { useContextualUpgrade } from "@/hooks/useContextualUpgrade";
import { ContextualUpgradePrompt } from "./ContextualUpgradePrompt";
import type { SubscriptionPlanType } from "@/types/subscription-plans";

interface UnifiedUpgradeTriggerProps {
  /**
   * The feature being accessed (e.g., 'quiz-openended', 'quiz-blanks')
   */
  feature: string;
  
  /**
   * Required plan for this feature
   */
  requiredPlan: SubscriptionPlanType;
  
  /**
   * Optional: Trigger on page mount (discovery mode)
   * Default: true (shows prompt when user explores restricted features)
   */
  triggerOnMount?: boolean;
  
  /**
   * Optional: Delay before showing prompt (ms)
   * Default: 2000 (2 seconds to let user see the page first)
   */
  delay?: number;
}

/**
 * UnifiedUpgradeTrigger - Non-blocking upgrade prompt for restricted features
 * 
 * Shows contextual upgrade prompts when users explore features they don't have access to.
 * Integrates with spam prevention and session context tracking.
 * 
 * @example
 * ```tsx
 * <UnifiedUpgradeTrigger 
 *   feature="Open-Ended Questions"
 *   requiredPlan="PREMIUM"
 *   triggerOnMount={true}
 *   delay={2000}
 * />
 * ```
 */
export function UnifiedUpgradeTrigger({
  feature,
  requiredPlan,
  triggerOnMount = true,
  delay = 2000,
}: UnifiedUpgradeTriggerProps) {
  const {
    promptState,
    triggerDiscoveryUpgrade,
    closePrompt,
  } = useContextualUpgrade();

  useEffect(() => {
    if (!triggerOnMount) return;

    // Delay to let user see the page content first
    const timer = setTimeout(() => {
      console.log(`[UnifiedUpgradeTrigger] Triggering discovery upgrade prompt for feature: ${feature}`);
      
      triggerDiscoveryUpgrade(feature, requiredPlan);
    }, delay);

    return () => clearTimeout(timer);
    // Only trigger once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render the upgrade prompt modal
  return (
    <ContextualUpgradePrompt
      open={promptState.open}
      onOpenChange={closePrompt}
      requiredPlan={promptState.requiredPlan}
      context={promptState.context}
    />
  );
}
