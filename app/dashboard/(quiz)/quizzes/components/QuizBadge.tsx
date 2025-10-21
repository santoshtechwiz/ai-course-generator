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

function QuizBadge({ children, className, variant = "secondary", tone, icon, ...props }: QuizBadgeProps) {
  const toneClasses =
    tone === "success"
      ? "bg-emerald-500/10 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-400/30"
      : tone === "warning"
      ? "bg-[hsl(var(--warning))]/10 dark:bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] dark:text-[hsl(var(--warning-foreground))] border-[hsl(var(--warning))]/30 dark:border-[hsl(var(--warning))]/40"
      : tone === "danger"
      ? "bg-rose-500/10 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-500/30 dark:border-rose-400/30"
      : "bg-muted/5 dark:bg-muted/10 text-muted-foreground border-border/50"

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
