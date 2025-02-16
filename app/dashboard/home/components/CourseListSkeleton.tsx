import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

const CourseListSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="flex flex-col h-full overflow-hidden w-full sm:max-w-md bg-card border border-border">
          {/* Image Section */}
          <div className="relative w-full pt-[56.25%]">
            <Skeleton className="absolute inset-0" />
            {/* Badges Skeleton */}
            <div className="absolute top-2 left-2 flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>

          {/* Content Section */}
          <CardContent className="flex-grow flex flex-col p-6">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-5/6 mb-4" />

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-3 gap-2">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex flex-col items-center justify-center">
                  <Skeleton className="h-5 w-5 mb-1" />
                  <Skeleton className="h-4 w-8 mb-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </CardContent>

          {/* Footer Section */}
          <CardFooter className="p-6 pt-0">
            <Skeleton className="h-9 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

export default CourseListSkeleton

