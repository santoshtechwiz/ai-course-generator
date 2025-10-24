import React from "react"
import { NeoLoader, SkeletonLoader } from "@/components/loader"

// Neobrutalism dashboard loading with consistent styling
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8 pt-24 items-center px-6">
      {/* Main loading indicator */}
      <NeoLoader 
        message="Loading your dashboard..." 
        size="lg" 
        variant="spinner"
        className="mb-4"
      />
      
      {/* Dashboard grid skeleton */}
      <div className="grid gap-6 w-full max-w-6xl md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-[var(--color-card)] border-4 border-[var(--color-border)] rounded-2xl shadow-[4px_4px_0_0_var(--color-border)] overflow-hidden flex flex-col p-6"
          >
            <div className="h-24 w-full bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded-lg animate-pulse mb-4 shadow-[2px_2px_0_0_var(--color-border)]" />
            <div className="flex-1 flex flex-col gap-3">
              <SkeletonLoader lines={2} />
              <div className="mt-auto flex gap-2">
                <div className="h-6 w-20 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded animate-pulse shadow-[2px_2px_0_0_var(--color-border)]" />
                <div className="h-6 w-14 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded animate-pulse shadow-[2px_2px_0_0_var(--color-border)]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
