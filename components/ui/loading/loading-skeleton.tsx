import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { MotionWrapper } from "../animations/motion-wrapper"

export function CoursePageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden">
        <Skeleton className="h-14 w-full" />
      </div>
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1">
          <Skeleton className="aspect-video w-full" />
          <div className="p-4 lg:p-6 space-y-4">
            <Skeleton className="h-8 w-[300px] mb-4" />
            <Skeleton className="h-4 w-full max-w-[600px]" />
            <Skeleton className="h-4 w-full max-w-[500px]" />
            <Skeleton className="h-4 w-full max-w-[400px]" />
          </div>
        </div>
        <div className="hidden lg:block w-[400px] border-l">
          <div className="p-4 space-y-4">
            <Skeleton className="h-8 w-[200px]" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function QuizSkeleton() {
  return (
    <MotionWrapper variant="fade" duration={0.3}>
      <div className="w-full max-w-3xl mx-auto">
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-[200px]" />
              <Skeleton className="h-6 w-[100px]" />
            </div>
            <Skeleton className="h-2 w-full" />
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-full max-w-[500px]" />
                <Skeleton className="h-6 w-full max-w-[400px]" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          </div>
          <div className="p-6 border-t flex justify-between items-center">
            <Skeleton className="h-5 w-[120px]" />
            <Skeleton className="h-10 w-[150px]" />
          </div>
        </div>
      </div>
    </MotionWrapper>
  )
}

export function CoursesListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <Skeleton className="h-40 w-full" />
          <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="flex justify-between pt-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function QuizzesListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card shadow-sm p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full max-w-[500px]" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
            <div className="flex gap-2 self-end md:self-center">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-8 w-[200px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3 mt-2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ContentSkeleton({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  )
}
