import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function StatusBadge({ status }: { status: string }) {
  if (!status) return <Badge variant="outline">N/A</Badge>

  // Normalize status to uppercase for consistent comparison
  const normalizedStatus = status.toUpperCase()

  switch (normalizedStatus) {
    case "ACTIVE":
      return (
        <Badge variant="default" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          Active
        </Badge>
      )
    case "CANCELED":
      return (
        <Badge variant="outline" className="text-orange-500 border-orange-500">
          Cancelled
        </Badge>
      )
    case "PAST_DUE":
      return <Badge variant="destructive">Past Due</Badge>
    case "INACTIVE":
      return (
        <Badge variant="outline" className={cn("text-muted-foreground border-muted-foreground/50")}>
          Inactive
        </Badge>
      )
    case "PENDING":
      return (
        <Badge variant="outline" className="text-primary border-primary">
          Pending
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

