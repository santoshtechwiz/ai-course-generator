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
        <Badge variant="default" className={`bg-purple-500 hover:bg-purple-600 ${className}`}>
          Pro
        </Badge>
      )
    case "ULTIMATE":
      return (
        <Badge variant="default" className={`bg-amber-500 border-4 border-amber-600 shadow-[4px_4px_0px_0px_hsl(var(--border))] ${className}`}>
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
