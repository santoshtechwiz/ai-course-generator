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
        "sticky top-0 z-50 bg-white dark:bg-gray-900 border-b-4 border-black dark:border-white shadow-[0_4px_0px_0px_rgba(0,0,0,0.8)] dark:shadow-[0_4px_0px_0px_rgba(255,255,255,0.3)] transition-all duration-300"
      )}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-2 sm:gap-3 py-3">
          {/* Left: Course info */}
          <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-300 to-yellow-400 dark:from-yellow-400 dark:to-yellow-500 border-3 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)] flex items-center justify-center group hover:scale-105 transition-transform">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-black dark:text-black group-hover:rotate-6 transition-transform" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h1
                className="font-black uppercase tracking-tight truncate text-black dark:text-white text-base sm:text-xl"
                title={course.title}
              >
                {course.title}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 text-xs font-bold text-gray-600 dark:text-gray-400">
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
                    <div className="flex items-center gap-1 text-lime-600 dark:text-lime-400">
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
              className="hidden xl:flex bg-cyan-500 hover:bg-cyan-600 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-black dark:text-white font-black border-3 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all uppercase text-xs h-9 rounded-none gap-1.5"
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
