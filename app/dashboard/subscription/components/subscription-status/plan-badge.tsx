import type { SubscriptionPlanType } from "@/types/subscription"
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
    case "PREMIUM":
      return (
        <Badge variant="default" className={`bg-secondary hover:bg-secondary/90 ${className}`}>
          Pro
        </Badge>
      )
    case "ULTIMATE":
      return (
        <Badge variant="default" className={`bg-warning border-4 border-warning shadow-neo ${className}`}>
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
