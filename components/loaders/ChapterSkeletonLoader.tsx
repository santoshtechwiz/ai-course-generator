"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface ChapterSkeletonLoaderProps {
  className?: string
  showSidebar?: boolean
  showVideo?: boolean
}

export function ChapterSkeletonLoader({
  className,
  showSidebar = true,
  showVideo = true
}: ChapterSkeletonLoaderProps) {
  return (
    <div className={cn("w-full flex", className)}>
      {/* Main Content */}
      <div className="flex-1 space-y-4 p-4">
        {/* Video Skeleton */}
        {showVideo && (
          <div className="aspect-video bg-muted animate-pulse rounded-lg" />
        )}

        {/* Title and Progress */}
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
          <div className="h-4 bg-muted rounded w-4/6 animate-pulse" />
        </div>
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:w-80 border-l border-border p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
          </div>

          {/* Chapter List */}
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="h-12 w-20 bg-muted rounded animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ChapterSkeletonLoader