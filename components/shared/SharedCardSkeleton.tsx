"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface CardSkeletonProps {
  compact?: boolean
  className?: string
}

export function SharedCardSkeleton({ compact = false, className }: CardSkeletonProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden",
        compact ? "h-[200px]" : "h-[360px]",
        "animate-pulse", 
        className
      )}
    >
      {/* Image Skeleton */}
      <div className="relative aspect-video w-full bg-muted">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/60 to-muted/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* Badge Skeleton */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>

        {/* Title and Description */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          {!compact && <Skeleton className="h-4 w-full" />}
          {!compact && <Skeleton className="h-4 w-2/3" />}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </Card>
  )
}
