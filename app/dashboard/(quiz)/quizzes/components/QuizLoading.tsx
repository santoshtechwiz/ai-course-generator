"use client"

/**
 * @deprecated This component is deprecated. Use UnifiedLoader from @/components/loaders instead.
 * This file is kept for backward compatibility only.
 */

import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function QuizLoading() {
  return (
    <div className="space-y-6">
      {/* Search and filters skeleton */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
        <Skeleton className="h-10 w-[300px]" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-20" />
              </div>
              <Skeleton className="h-24 w-full" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Load more skeleton */}
      <div className="flex justify-center mt-8">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}
