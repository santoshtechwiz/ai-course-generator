import { Badge } from "@/components/ui/badge"

type SubscriptionStatusType = "ACTIVE" | "INACTIVE" | "PAST_DUE" | "CANCELED" | "PENDING" | null | string

interface StatusBadgeProps {
  status: SubscriptionStatusType
  className?: string
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  if (!status)
    return (
      <Badge variant="outline" className={className}>
        N/A
      </Badge>
    )

  // Normalize status to uppercase for consistent comparison
  const normalizedStatus = status.toUpperCase()

  switch (normalizedStatus) {
    case "ACTIVE":
      return (
        <Badge variant="default" className={`bg-gradient-to-r from-green-500 to-emerald-500 text-white ${className}`}>
          Active
        </Badge>
      )
    case "CANCELED":
      return (
        <Badge variant="outline" className={`text-orange-500 border-orange-500 ${className}`}>
          Cancelled
        </Badge>
      )
    case "PAST_DUE":
      return (
        <Badge variant="destructive" className={className}>
          Past Due
        </Badge>
      )
    case "INACTIVE":
      return (
        <Badge variant="outline" className={className}>
          Inactive
        </Badge>
      )
    case "PENDING":
      return (
        <Badge variant="outline" className={`text-blue-500 border-blue-500 ${className}`}>
          Pending
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      )
  }
}

