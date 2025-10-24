import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted border-2 border-border shadow-neo-sm", className)}
      {...props}
    />
  )
}

// Specialized skeleton components for different content types
function QuizSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      {/* Question */}
      <div className="neo-card space-y-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-5/6" />
        
        {/* Options */}
        <div className="space-y-3 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
        
        {/* Buttons */}
        <div className="flex justify-between mt-6">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
      
      {/* Progress */}
      <div className="flex items-center space-x-4">
        <Skeleton className="h-2 flex-1" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}

function FlashcardSkeleton() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="text-center space-y-2 mb-8">
        <Skeleton className="h-8 w-1/2 mx-auto" />
        <Skeleton className="h-4 w-1/3 mx-auto" />
      </div>
      
      {/* Card */}
      <div className="neo-card min-h-[200px] sm:min-h-[240px] md:min-h-[280px] space-y-4 sm:space-y-6">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
        
        {/* Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-24" />
          ))}
        </div>
      </div>
      
      {/* Progress */}
      <div className="flex items-center justify-between mt-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-2 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="neo-card space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex justify-between items-center mt-6">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-6 w-16" />
      </div>
    </div>
  )
}

export { Skeleton }
