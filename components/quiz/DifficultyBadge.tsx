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
        return "bg-green-500 text-white border-green-500"
      case "medium":
        return "bg-yellow-500 text-white border-yellow-500"
      case "hard":
        return "bg-red-500 text-white border-red-500"
      default:
        return "bg-gray-500 text-white border-gray-500"
    }
  }

  return (
    <Badge className={cn("text-xs font-medium", getDifficultyColor(difficulty), className)}>
      <Zap className="w-3 h-3 mr-1" />
      {difficulty}
    </Badge>
  )
}
