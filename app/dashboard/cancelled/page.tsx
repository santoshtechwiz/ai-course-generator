'use client'
import { Suspense } from "react"
import { CancelledContent } from "./components/CancelledContent"
import PageLoader from "@/components/ui/loader"

export default function CancelledPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <Suspense fallback={<PageLoader />}>
        <CancelledContent />
      </Suspense>
    </div>
  )
}