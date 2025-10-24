import React from "react"
import { UnifiedLoader } from "@/components/loaders"

// Lightweight loader for /dashboard route while server components or auth session resolve
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 pt-24 items-center px-6 animate-in fade-in min-h-screen">
      <UnifiedLoader
        message="Loading Dashboard..."
        variant="spinner"
        size="lg"
        fullWidth={false}
      />
      
      {/* Grid skeleton */}
      <div className="grid gap-6 w-full max-w-6xl md:grid-cols-2 lg:grid-cols-3 mt-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-48 rounded-[var(--radius)] border-4 border-[var(--color-border)] bg-[var(--color-card)] shadow-[var(--shadow-neo)] overflow-hidden flex flex-col animate-pulse"
          >
            <div className="h-24 w-full bg-[var(--color-muted)]" />
            <div className="p-4 flex-1 flex flex-col gap-3">
              <div className="h-4 w-3/4 bg-[var(--color-muted)]/70 rounded" />
              <div className="h-3 w-1/2 bg-[var(--color-muted)]/60 rounded" />
              <div className="mt-auto flex gap-2">
                <div className="h-6 w-20 bg-[var(--color-muted)]/50 rounded" />
                <div className="h-6 w-14 bg-[var(--color-muted)]/40 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
