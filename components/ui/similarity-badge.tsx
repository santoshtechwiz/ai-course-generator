import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getSimilarityCategory } from "@/lib/utils/text-similarity"

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
  const { category, color } = getSimilarityCategory(similarity)

  // Determine variant based on similarity category
  const getVariant = (): BadgeProps["variant"] => {
    switch (category) {
      case "exact":
        return "default"
      case "high":
        return "secondary"
      case "moderate":
        return "outline"
      case "low":
        return "destructive"
      case "different":
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
      case "exact":
        return "Perfect match! Your answer is exactly correct."
      case "high":
        return "Very close! Your answer is almost identical to the correct one."
      case "moderate":
        return "Somewhat similar to the correct answer."
      case "low":
        return "Your answer has some similarities but differs significantly."
      case "different":
        return "Your answer is quite different from the correct one."
      default:
        return "Similarity score"
    }
  }

  const badge = (
    <Badge variant={getVariant()} className={`${getSizeClasses()} ${className}`} {...props}>
      <span className={color}>{similarity}%</span>
      {size !== "sm" && <span className="ml-1 opacity-80">{category === "exact" ? "match" : "similarity"}</span>}
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
