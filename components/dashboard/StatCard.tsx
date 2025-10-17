import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

export interface StatCardProps {
  label: string
  value: string | number
  icon?: LucideIcon
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'destructive'
  description?: string
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  className?: string
}

const variantStyles = {
  default: {
    card: "bg-card border-border",
    icon: "bg-muted text-muted-foreground",
    value: "text-foreground",
  },
  primary: {
    card: "bg-primary/5 border-primary/20",
    icon: "bg-primary/10 text-primary",
    value: "text-primary",
  },
  success: {
    card: "bg-emerald-500/5 border-emerald-500/20",
    icon: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    value: "text-emerald-600 dark:text-emerald-400",
  },
  warning: {
    card: "bg-amber-500/5 border-amber-500/20",
    icon: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    value: "text-amber-600 dark:text-amber-400",
  },
  destructive: {
    card: "bg-red-500/5 border-red-500/20",
    icon: "bg-red-500/10 text-red-600 dark:text-red-400",
    value: "text-red-600 dark:text-red-400",
  },
}

export function StatCard({
  label,
  value,
  icon: Icon,
  variant = 'default',
  description,
  trend,
  className,
}: StatCardProps) {
  const styles = variantStyles[variant]

  return (
    <Card className={cn(styles.card, "transition-all hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            {/* Label */}
            <p className="text-sm font-medium text-muted-foreground">
              {label}
            </p>

            {/* Value */}
            <p className={cn("text-3xl font-bold tracking-tight", styles.value)}>
              {value}
            </p>

            {/* Description or Trend */}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}

            {trend && (
              <div className="flex items-center gap-1 text-xs">
                <span
                  className={cn(
                    "font-medium",
                    trend.isPositive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {trend.isPositive ? "+" : ""}
                  {trend.value}%
                </span>
                <span className="text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>

          {/* Icon */}
          {Icon && (
            <div
              className={cn(
                "h-12 w-12 rounded-lg flex items-center justify-center",
                styles.icon
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Preset variants for common use cases
export const StatCardPresets = {
  totalCourses: (value: number) => ({
    label: "Total Enrolled",
    value,
    variant: 'default' as const,
  }),
  
  inProgressCourses: (value: number) => ({
    label: "In Progress",
    value,
    variant: 'primary' as const,
  }),
  
  completedCourses: (value: number) => ({
    label: "Completed",
    value,
    variant: 'success' as const,
  }),
  
  favoriteCourses: (value: number) => ({
    label: "Favorites",
    value,
    variant: 'warning' as const,
  }),
  
  totalQuizzes: (value: number) => ({
    label: "Total Attempts",
    value,
    variant: 'default' as const,
  }),
  
  averageScore: (value: number) => ({
    label: "Average Score",
    value: `${value}%`,
    variant: value >= 80 ? 'success' as const : value >= 60 ? 'warning' as const : 'destructive' as const,
  }),
  
  timeSpent: (hours: number, minutes: number) => ({
    label: "Time Spent",
    value: `${hours}h ${minutes}m`,
    variant: 'default' as const,
  }),
  
  streak: (days: number) => ({
    label: "Best Streak",
    value: `${days} days`,
    variant: days >= 7 ? 'success' as const : 'default' as const,
  }),
}
