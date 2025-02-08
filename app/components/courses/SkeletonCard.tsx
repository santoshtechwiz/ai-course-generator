import type React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export const SkeletonCard: React.FC = () => {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-between">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  )
}

