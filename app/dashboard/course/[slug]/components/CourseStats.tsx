"use client"

import React from "react"
import { Play, Clock, CheckCircle, Award } from "lucide-react"
import { cn } from "@/lib/utils"

interface CourseStatsProps {
  totalVideos: number
  completedVideos: number
  totalDuration: string
  progressPercentage: number
  variant?: "compact" | "detailed"
  className?: string
}

/**
 * CourseStats Component
 * 
 * Displays course statistics in a clean, consistent format.
 * Can be used in headers, sidebars, or standalone.
 */
export function CourseStats({
  totalVideos,
  completedVideos,
  totalDuration,
  progressPercentage,
  variant = "compact",
  className,
}: CourseStatsProps) {
  if (variant === "detailed") {
    return (
      <div className={cn("grid grid-cols-3 gap-2", className)}>
        {/* Total Videos */}
        <div className="bg-blue-100 dark:bg-blue-900/30 border-2 border-black dark:border-white p-3 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Play className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="font-black text-xl text-black dark:text-white">{totalVideos}</div>
          <div className="font-bold text-xs uppercase tracking-tight text-gray-600 dark:text-gray-400">
            Chapters
          </div>
        </div>

        {/* Completed */}
        <div
          className={cn(
            "border-2 border-black dark:border-white p-3 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
            completedVideos > 0
              ? "bg-green-400 dark:bg-green-600 text-black"
              : "bg-green-100 dark:bg-green-900/30 text-black dark:text-white"
          )}
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <CheckCircle className="h-4 w-4" />
          </div>
          <div className="font-black text-xl">{completedVideos}</div>
          <div className="font-bold text-xs uppercase tracking-tight">Completed</div>
          {progressPercentage > 0 && (
            <div className="text-xs font-bold mt-1">{progressPercentage}% ✓</div>
          )}
        </div>

        {/* Duration */}
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border-2 border-black dark:border-white p-3 text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="font-black text-xl text-black dark:text-white">{totalDuration}</div>
          <div className="font-bold text-xs uppercase tracking-tight text-gray-600 dark:text-gray-400">
            Total Time
          </div>
        </div>
      </div>
    )
  }

  // Compact variant (inline)
  return (
    <div className={cn("flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-400", className)}>
      <div className="flex items-center gap-1">
        <Play className="h-3 w-3 flex-shrink-0" />
        <span>{totalVideos}</span>
      </div>
      <span>•</span>
      <div className="flex items-center gap-1">
        <Clock className="h-3 w-3 flex-shrink-0" />
        <span>{totalDuration}</span>
      </div>
      {progressPercentage > 0 && (
        <>
          <span>•</span>
          <div className="flex items-center gap-1 text-lime-600 dark:text-lime-400">
            <CheckCircle className="h-3 w-3 flex-shrink-0" />
            <span className="font-black">{progressPercentage}%</span>
          </div>
        </>
      )}
      {progressPercentage === 100 && (
        <>
          <span>•</span>
          <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
            <Award className="h-3 w-3 flex-shrink-0 animate-pulse" />
            <span className="font-black">Complete!</span>
          </div>
        </>
      )}
    </div>
  )
}

export default React.memo(CourseStats)
