"use client"

/**
 * @deprecated This component is deprecated. Use UnifiedLoader from @/components/loaders instead.
 * This file is kept for backward compatibility only.
 */

import { Skeleton } from "@/components/ui/skeleton"
import { ModuleLayout } from "@/components/layout/ModuleLayout"

export function ModuleLoading() {
  return (
    <ModuleLayout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-3 items-center text-center">
          <Skeleton className="h-12 w-3/4 max-w-md" />
          <Skeleton className="h-4 w-2/3 max-w-sm" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <div className="flex justify-between mt-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModuleLayout>
  )
}
