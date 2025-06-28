import type React from "react"
import { CreditCard, Zap, Rocket, Crown } from "lucide-react"
import type { SubscriptionPlanType } from "@/app/types/subscription"

export const planIcons: Record<SubscriptionPlanType, React.ReactNode> = {
  FREE: <CreditCard className="h-5 w-5 mr-2 text-slate-500" />,
  BASIC: <Zap className="h-5 w-5 mr-2 text-blue-500" />,
  PRO: <Rocket className="h-5 w-5 mr-2 text-purple-500" />,
  ULTIMATE: <Crown className="h-5 w-5 mr-2 text-amber-500" />,
  
}
