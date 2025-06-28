import type { SubscriptionPlanType } from "@/app/types/subscription"
import { Badge } from "@/components/ui/badge"

interface PlanBadgeProps {
  plan: SubscriptionPlanType | string | null
  className?: string
}

export function PlanBadge({ plan, className = "" }: PlanBadgeProps) {
  if (!plan)
    return (
      <Badge variant="outline" className={className}>
        No Plan
      </Badge>
    )

  const normalizedPlan = plan.toUpperCase() as SubscriptionPlanType

  switch (normalizedPlan) {
    case "FREE":
      return (
        <Badge variant="outline" className={className}>
          Free
        </Badge>
      )
    case "BASIC":
      return (
        <Badge variant="default" className={`bg-blue-500 hover:bg-blue-600 ${className}`}>
          Basic
        </Badge>
      )
    case "PRO":
      return (
        <Badge variant="default" className={`bg-purple-500 hover:bg-purple-600 ${className}`}>
          Pro
        </Badge>
      )
    case "ULTIMATE":
      return (
        <Badge variant="default" className={`bg-gradient-to-r from-amber-500 to-orange-500 ${className}`}>
          Ultimate
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className={className}>
          {plan}
        </Badge>
      )
  }
}
