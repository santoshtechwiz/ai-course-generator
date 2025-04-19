import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Code, Database, Globe } from "lucide-react"

export function CoursesListSkeleton() {
  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
      {/* Section Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-64 rounded-lg hidden sm:block" />
          <div className="flex items-center border rounded-md overflow-hidden">
            <Skeleton className="h-9 w-9 rounded-none" />
            <Skeleton className="h-9 w-9 rounded-none" />
          </div>
        </div>
      </div>

      {/* Course Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[...Array(8)].map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>

      {/* Infinite Loading Indicator */}
      <div className="flex justify-center mt-8">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 animate-pulse">
          <div className="h-4 w-4 rounded-full bg-primary/30 animate-pulse"></div>
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
    </div>
  )
}

function CourseCardSkeleton() {
  return (
    <div className="rounded-lg border overflow-hidden bg-card transition-all duration-200 hover:shadow-md">
      {/* Card Image Area */}
      <div className="relative w-full h-48 bg-muted/60 animate-pulse overflow-hidden">
        {/* Difficulty Badge */}
        <div className="absolute top-3 left-3 z-10">
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Category Icon Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <CategoryIconSkeleton />
        </div>

        {/* Rating and Views */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between z-10">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-4">
        {/* Title and Description */}
        <div>
          <Skeleton className="h-6 w-3/4 rounded-md mb-2" />
          <Skeleton className="h-4 w-full rounded-sm" />
          <Skeleton className="h-4 w-2/3 rounded-sm mt-1" />
        </div>

        {/* Category and Duration */}
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      </div>
    </div>
  )
}

function StatSkeleton() {
  return (
    <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
      <Skeleton className="h-4 w-4 rounded-full mb-1" />
      <Skeleton className="h-5 w-5 rounded-md" />
      <Skeleton className="h-3 w-12 rounded-sm mt-1" />
    </div>
  )
}

function CategoryIconSkeleton() {
  // Randomly select an icon to make the skeleton more interesting
  const icons = [BookOpen, Code, Database, Globe]
  const RandomIcon = icons[Math.floor(Math.random() * icons.length)]
  return <RandomIcon className="h-16 w-16" />
}
