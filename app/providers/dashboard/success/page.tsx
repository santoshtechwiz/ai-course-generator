import { Suspense } from "react"
import { SuccessContent } from "./components/SuccessContent"
import { Skeleton } from "@/components/ui/skeleton" // Shadcn Skeleton for loading state
import { Card } from "@/components/ui/card" // Shadcn Card for container styling

export default function SuccessPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md border-none shadow-sm bg-card">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-6 space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" /> {/* Shadcn Skeleton for loading spinner */}
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          }
        >
          <SuccessContent />
        </Suspense>
      </Card>
    </div>
  )
}