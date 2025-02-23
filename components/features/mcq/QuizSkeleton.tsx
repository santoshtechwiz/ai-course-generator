import { Skeleton } from "@/components/ui/skeleton"

export const QuizSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-8 w-1/2" />
    <Skeleton className="h-8 w-1/4" />
  </div>
)

