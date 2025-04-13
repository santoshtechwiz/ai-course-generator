import { Skeleton } from "@/components/ui/skeleton"

export function SubscriptionSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Current plan skeleton */}
      <div className="rounded-xl border p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="space-y-2 w-full max-w-[300px]">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-2 w-full" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg p-4 shadow-sm">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing plans skeleton */}
      <div className="text-center py-8">
        <Skeleton className="h-10 w-64 mx-auto mb-3" />
        <Skeleton className="h-5 w-full max-w-2xl mx-auto" />
      </div>

      <div className="flex items-center justify-center space-x-4 pt-4 mb-8">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-10" />
        <Skeleton className="h-6 w-32" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border p-6 shadow-sm h-[500px]">
            <div className="space-y-4">
              <div className="flex justify-between">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>

            <div className="mt-6 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />

              <div className="space-y-2 mt-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center">
                    <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
