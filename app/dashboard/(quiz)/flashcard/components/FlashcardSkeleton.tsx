import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function FlashcardSkeleton() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton className="h-2 w-full" />
      </div>

      <Card className="w-full min-h-[300px] p-8 shadow-lg">
        <div className="flex flex-col h-full">
          <Skeleton className="h-4 w-24 mb-8" />
          <div className="flex-1 flex items-center justify-center">
            <Skeleton className="h-8 w-3/4" />
          </div>
          <Skeleton className="h-4 w-32 mx-auto mt-8" />
        </div>
      </Card>

      <div className="mt-6 flex justify-between items-center">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  )
}
