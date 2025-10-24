"use client"

import { NeoLoader, SkeletonLoader } from "@/components/loader"

export function QuizLoading() {
  return (
    <div className="space-y-6">
      {/* Main loading indicator */}
      <div className="flex justify-center mb-8">
        <NeoLoader 
          message="Loading quizzes..." 
          size="lg" 
          variant="spinner"
        />
      </div>

      {/* Search and filters skeleton */}
      <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
        <div className="h-10 w-[300px] bg-[var(--color-muted)] border-4 border-[var(--color-border)] rounded-xl animate-pulse shadow-[4px_4px_0_0_var(--color-border)]" />
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded animate-pulse shadow-[2px_2px_0_0_var(--color-border)]" />
          <div className="h-10 w-24 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded animate-pulse shadow-[2px_2px_0_0_var(--color-border)]" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="bg-[var(--color-card)] border-4 border-[var(--color-border)] rounded-2xl p-6 shadow-[4px_4px_0_0_var(--color-border)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="h-6 w-32 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded animate-pulse shadow-[2px_2px_0_0_var(--color-border)]" />
                <div className="h-6 w-20 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded animate-pulse shadow-[2px_2px_0_0_var(--color-border)]" />
              </div>
              <div className="h-24 w-full bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded-lg animate-pulse shadow-[2px_2px_0_0_var(--color-border)]" />
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded animate-pulse shadow-[2px_2px_0_0_var(--color-border)]" />
                <div className="h-8 w-24 bg-[var(--color-muted)] border-2 border-[var(--color-border)] rounded animate-pulse shadow-[2px_2px_0_0_var(--color-border)]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load more skeleton */}
      <div className="flex justify-center mt-8">
        <div className="h-10 w-32 bg-[var(--color-muted)] border-4 border-[var(--color-border)] rounded-xl animate-pulse shadow-[4px_4px_0_0_var(--color-border)]" />
      </div>
    </div>
  )
}
