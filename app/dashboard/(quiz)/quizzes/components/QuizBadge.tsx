"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface QuizBadgeProps {
  children?: React.ReactNode
  className?: string
  variant?: "solid" | "outline" | "secondary"
  tone?: "default" | "success" | "warning" | "danger" | string
  icon?: React.ReactNode
  'aria-label'?: string
}

export function QuizBadge({ children, className, variant = "secondary", tone, icon, ...props }: QuizBadgeProps) {
  const toneClasses =
    tone === "success"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
      : tone === "warning"
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
      : tone === "danger"
      ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30"
      : "bg-muted/5 text-muted-foreground border-border/50"

  return (
    <Badge
      variant={variant === "solid" ? "default" : variant === "outline" ? "outline" : "secondary"}
      className={cn("text-sm px-3 py-1 font-semibold rounded-full shadow-sm inline-flex items-center gap-2", toneClasses, className)}
      {...props}
    >
      {icon && <span className="flex items-center">{icon}</span>}
      <span>{children}</span>
    </Badge>
  )
}

export default QuizBadge
