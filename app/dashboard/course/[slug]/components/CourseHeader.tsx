"use client"

import React from "react"
import { BookOpen, Play, Clock, CheckCircle, Menu, X } from "lucide-react"
import { Button } from "@/components/ui"
import { cn } from "@/lib/utils"
import ActionButtons from "./ActionButtons"
import type { FullCourseType } from "@/app/types/types"

interface CourseHeaderProps {
  course: FullCourseType
  isShared: boolean
  isOwner: boolean
  stats: {
    totalVideos: number
    completedVideos: number
    totalDuration: string
    progressPercentage: number
  }
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

/**
 * CourseHeader Component
 * 
 * Displays the sticky header for the course page including:
 * - Course title and metadata
 * - Progress statistics
 * - Action buttons (share, download, etc.)
 * - Sidebar toggle
 */
export function CourseHeader({
  course,
  isShared,
  isOwner,
  stats,
  sidebarCollapsed,
  onToggleSidebar,
}: CourseHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-[hsl(var(--surface))] border-b-4 border-[hsl(var(--border))] shadow-neo transition-all duration-300"
      )}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-3 py-3">
          {/* Left: Course info */}
          <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[hsl(var(--warning))] border-3 border-[hsl(var(--border))] shadow-neo flex items-center justify-center group hover:scale-105 transition-transform">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-[hsl(var(--foreground))] group-hover:rotate-6 transition-transform" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h1
                className="font-black uppercase tracking-tight truncate text-[hsl(var(--foreground))] text-base sm:text-xl"
                title={course.title}
              >
                {course.title}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 text-xs font-bold text-[hsl(var(--foreground))]/60">
                <div className="flex items-center gap-1">
                  <Play className="h-3 w-3 flex-shrink-0" />
                  <span>{stats.totalVideos}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 flex-shrink-0" />
                  <span>{stats.totalDuration}</span>
                </div>
                {stats.progressPercentage > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1 text-[hsl(var(--success))]">
                      <CheckCircle className="h-3 w-3 flex-shrink-0" />
                      <span className="font-black">{stats.progressPercentage}%</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              variant="default"
              size="sm"
              onClick={onToggleSidebar}
              className="hidden xl:flex bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 text-[hsl(var(--foreground))] font-black border-3 border-[hsl(var(--border))] shadow-neo hover:shadow-neo-hover hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all uppercase text-xs h-9 rounded-none gap-1.5 focus-visible:ring-4 focus-visible:ring-[hsl(var(--accent))]/50 focus-visible:outline-none"
              aria-label={sidebarCollapsed ? "Show playlist" : "Hide playlist"}
            >
              {sidebarCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
              <span className="hidden sm:inline">{sidebarCollapsed ? "Playlist" : "Hide"}</span>
            </Button>
            <ActionButtons
              slug={course.slug}
              isOwner={isOwner}
              variant="compact"
              title={course.title}
              courseId={course.id}
            />
          </div>
        </div>
      </div>
    </header>
  )
}

export default React.memo(CourseHeader)
