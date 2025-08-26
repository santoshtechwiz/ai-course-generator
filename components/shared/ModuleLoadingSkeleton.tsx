"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ModuleLoadingProps {
  itemCount?: number
  variant?: "default" | "compact" | "detailed"
}

export function ModuleLoadingSkeleton({ 
  itemCount = 6,
  variant = "default" 
}: ModuleLoadingProps) {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[300px]" />
      </div>

      {/* Grid or List skeleton */}
      <div className={cn(
        "grid gap-6",
        variant === "compact" ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" :
        variant === "detailed" ? "grid-cols-1 md:grid-cols-2" :
        "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      )}>
        {Array(itemCount).fill(0).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-20" />
              </div>
              {variant === "detailed" ? (
                <>
                  <Skeleton className="h-32 w-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </>
              ) : (
                <Skeleton className="h-24 w-full" />
              )}
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex justify-center mt-8">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}
