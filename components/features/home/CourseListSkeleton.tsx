import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

const CourseListSkeleton = () => {
  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
      {/* Section Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="h-8 w-48 rounded-lg" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-64 rounded-lg" />
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      </div>

      {/* Course Grid Skeleton with larger cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden min-h-96">
            <div className="relative w-full h-64 bg-muted animate-pulse">
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
              <div className="absolute top-4 left-4">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
            <CardContent className="p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-8 w-4/5 rounded-lg" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-3/4 rounded" />
                </div>
                <Skeleton className="h-4 w-48 rounded" />
                <div className="flex items-center gap-3 p-3 bg-muted/60 rounded-lg">
                  <Skeleton className="h-5 w-16 rounded" />
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((_, j) => (
                      <Skeleton key={j} className="h-4 w-4 rounded" />
                    ))}
                  </div>
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/60 rounded-lg">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-16 rounded" />
                        <Skeleton className="h-4 w-20 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-border/50">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-12 w-32 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default CourseListSkeleton
