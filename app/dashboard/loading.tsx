import React from "react"

// Lightweight skeleton loader for /dashboard route while server components or auth session resolve
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 pt-24 items-center px-6 animate-in fade-in">
      <div className="h-8 w-48 rounded-md bg-muted animate-pulse" />
      <div className="h-4 w-80 max-w-full rounded-md bg-muted/70 animate-pulse" />
      <div className="grid gap-6 w-full max-w-6xl md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-48 rounded-xl border bg-background/40 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col"
          >
            <div className="h-24 w-full bg-muted animate-pulse" />
            <div className="p-4 flex-1 flex flex-col gap-3">
              <div className="h-4 w-3/4 bg-muted/70 rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-muted/60 rounded animate-pulse" />
              <div className="mt-auto flex gap-2">
                <div className="h-6 w-20 bg-muted/50 rounded animate-pulse" />
                <div className="h-6 w-14 bg-muted/40 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
