"use client"

import { Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface UnifiedLoaderProps {
  variant?: "spinner" | "skeleton" | "dots" | "pulse"
  size?: "sm" | "md" | "lg"
  message?: string
  subMessage?: string
  className?: string
  fullScreen?: boolean
}

export function UnifiedLoader({
  variant = "spinner",
  size = "md",
  message,
  subMessage,
  className,
  fullScreen = false,
}: UnifiedLoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  const containerClasses = cn(
    "flex flex-col items-center justify-center gap-3",
    fullScreen && "min-h-screen",
    !fullScreen && "min-h-[200px] p-8",
    className,
  )

  if (variant === "skeleton") {
    return (
      <div className={containerClasses}>
        <div className="space-y-3 w-full max-w-md">
          <Skeleton className="h-4 w-3/4 bg-muted" />
          <Skeleton className="h-4 w-1/2 bg-muted" />
          <Skeleton className="h-4 w-2/3 bg-muted" />
        </div>
        {message && <p className="text-sm text-muted-foreground mt-2">{message}</p>}
      </div>
    )
  }

  if (variant === "dots") {
    return (
      <div className={containerClasses}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "rounded-full bg-primary animate-bounce",
                size === "sm" && "h-2 w-2",
                size === "md" && "h-3 w-3",
                size === "lg" && "h-4 w-4",
              )}
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: "0.6s",
              }}
            />
          ))}
        </div>
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
        {subMessage && <p className="text-xs text-muted-foreground/70">{subMessage}</p>}
      </div>
    )
  }

  if (variant === "pulse") {
    return (
      <div className={containerClasses}>
        <div className={cn("rounded-full bg-primary/20 animate-pulse", sizeClasses[size])} />
        {message && <p className="text-sm text-muted-foreground animate-pulse">{message}</p>}
        {subMessage && <p className="text-xs text-muted-foreground/70 animate-pulse">{subMessage}</p>}
      </div>
    )
  }

  // Default spinner variant
  return (
    <div className={containerClasses}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {message && <p className="text-sm font-medium text-foreground">{message}</p>}
      {subMessage && <p className="text-xs text-muted-foreground">{subMessage}</p>}
    </div>
  )
}
