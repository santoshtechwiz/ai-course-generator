import { Skeleton } from "@/components/ui/skeleton"

export default function CourseLoading() {
  return (
    <div className="flex flex-col lg:flex-row w-full min-h-[calc(100vh-4rem)] gap-4 p-4 animate-pulse">
      <div className="flex-grow lg:w-3/4 space-y-6">
        {/* Video player skeleton */}
        <Skeleton className="w-full aspect-video rounded-lg" />

        {/* Title and description */}
        <div className="space-y-3">
          <Skeleton className="h-8 w-3/4 rounded-md" />
          <Skeleton className="h-4 w-1/2 rounded-md" />
        </div>

        {/* Content tabs */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>

          {/* Tab content */}
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-md" />
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:w-1/4 lg:min-w-[300px] space-y-4">
        <Skeleton className="h-12 w-full rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        <div className="mt-6">
          <Skeleton className="h-40 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}
