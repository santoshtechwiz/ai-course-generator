"use client"

import { Badge } from "@/components/ui/badge"
import { Tag } from "lucide-react"
import { cn } from "@/lib/utils"

interface TagsDisplayProps {
  tags: string[]
  maxVisible?: number
  className?: string
  variant?: "default" | "secondary" | "outline"
}

export function TagsDisplay({ tags, maxVisible = 3, className, variant = "secondary" }: TagsDisplayProps) {
  if (!tags || tags.length === 0) return null

  const visibleTags = tags.slice(0, maxVisible)
  const remainingCount = tags.length - maxVisible

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <Tag className="w-4 h-4 text-muted-foreground" />
      {visibleTags.map((tag, index) => (
        <Badge key={index} variant={variant} className="text-xs">
          {tag}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remainingCount} more
        </Badge>
      )}
    </div>
  )
}
