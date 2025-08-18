import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getSimilarityLabel } from "@/lib/utils/text-similarity"

interface SimilarityBadgeProps extends Omit<BadgeProps, "variant"> {
  similarity: number
  showTooltip?: boolean
  size?: "sm" | "md" | "lg"
}

export function SimilarityBadge({
  similarity,
  showTooltip = true,
  size = "md",
  className,
  ...props
}: SimilarityBadgeProps) {
  const label = getSimilarityLabel(similarity / 100)
  const category = label.toLowerCase()
  const color =
    category === "excellent" ? "text-green-600" :
    category === "very good" ? "text-emerald-600" :
    category === "good" ? "text-yellow-600" :
    category === "fair" ? "text-orange-600" :
    category === "needs improvement" ? "text-red-600" : "text-gray-600"

  // Determine variant based on similarity category
  const getVariant = (): BadgeProps["variant"] => {
    switch (category) {
      case "excellent":
        return "default"
      case "very good":
        return "secondary"
      case "good":
        return "outline"
      case "fair":
        return "destructive"
      case "needs improvement":
        return "destructive"
      default:
        return "outline"
    }
  }

  // Get size-specific classes
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-xs px-1.5 py-0.5"
      case "lg":
        return "text-sm px-3 py-1"
      case "md":
      default:
        return "text-xs px-2 py-0.5"
    }
  }

  // Get tooltip text based on similarity category
  const getTooltipText = () => {
    switch (category) {
      case "excellent":
        return "Perfect! Your answer matches the expected response very closely."
      case "very good":
        return "Great job! Your answer is very close to the expected response."
      case "good":
        return "Good work! Your answer captures the main concepts correctly."
      case "fair":
        return "You're on the right track, but try to be more specific or complete."
      case "needs improvement":
        return "Your answer has some relevant elements, but needs more accuracy."
      default:
        return "Similarity score"
    }
  }

  const badge = (
    <Badge variant={getVariant()} className={`${getSizeClasses()} ${className}`} {...props}>
      <span className={color}>{similarity}%</span>
      {size !== "sm" && <span className="ml-1 opacity-80">{label}</span>}
    </Badge>
  )

  if (!showTooltip) {
    return badge
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
