import { Suspense } from "react"
import { CancelledContent } from "./components/CancelledContent"
import { Skeleton } from "@/components/ui/skeleton" // Shadcn Skeleton for loading state
import { Card } from "@/components/ui/card" // Shadcn Card for container styling

export default function CancelledPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <Suspense
          fallback={
            <div className="flex items-center justify-center space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" /> {/* Shadcn Skeleton for loading spinner */}
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          }
        >
          <CancelledContent />
        </Suspense>
      </Card>
    </div>
  )
}