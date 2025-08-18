"use client"

import { Badge } from "@/components/ui/badge"
import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface DifficultyBadgeProps {
  difficulty: string
  className?: string
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case "easy":
        return "bg-emerald-500 text-white border-emerald-500"
      case "medium":
        return "bg-amber-500 text-white border-amber-500"
      case "hard":
        return "bg-accent text-accent-foreground border-accent"
      default:
        return "bg-muted text-muted-foreground border-muted"
    }
  }

  return (
    <Badge className={cn("text-xs font-medium", getDifficultyColor(difficulty), className)}>
      <Zap className="w-3 h-3 mr-1" />
      {difficulty}
    </Badge>
  )
}
