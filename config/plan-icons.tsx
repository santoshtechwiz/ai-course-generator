import type React from "react"
import { CreditCard, Zap, Rocket, Crown } from "lucide-react"

type SubscriptionPlanType = "FREE" | "BASIC" | "PRO" | "ULTIMATE"

export const planIcons: Record<SubscriptionPlanType, React.ReactNode> = {
  FREE: <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />,
  BASIC: <Zap className="h-5 w-5 mr-2 text-primary" />,
  PRO: <Rocket className="h-5 w-5 mr-2 text-accent" />,
  ULTIMATE: <Crown className="h-5 w-5 mr-2 text-warning" />,
  
}
