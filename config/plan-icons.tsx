import type React from "react"
/**
 * Plan Icons Configuration
 *
 * This file contains the icon components for each subscription plan.
 */

import { CreditCard, Zap, Rocket, Crown } from "lucide-react"
import { SubscriptionPlanType } from "@/app/dashboard/subscription/types/subscription"


// Map of plan IDs to their icon components
export const planIcons: Record<SubscriptionPlanType, React.ReactNode> = {
  FREE: <CreditCard className="h-6 w-6" />,
  BASIC: <Zap className="h-6 w-6" />,
  PRO: <Rocket className="h-6 w-6" />,
  ULTIMATE: <Crown className="h-6 w-6" />,
}

