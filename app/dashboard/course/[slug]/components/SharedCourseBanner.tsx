"use client"

import React from "react"
import { BookOpen } from "lucide-react"

interface SharedCourseBannerProps {
  isShared: boolean
}

/**
 * SharedCourseBanner Component
 * 
 * Displays a banner at the top of the page when viewing a shared course.
 * Informs users about shared course features and limitations.
 */
export function SharedCourseBanner({ isShared }: SharedCourseBannerProps) {
  if (!isShared) return null

  return (
    <div className="bg-gradient-to-r from-cyan-400 to-blue-500 dark:from-cyan-600 dark:to-blue-700 border-b-4 border-black dark:border-white shadow-[0_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[0_4px_0px_0px_rgba(255,255,255,0.8)]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white dark:bg-gray-900 border-3 border-black dark:border-white flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]">
            <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-black dark:text-white" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-black text-black dark:text-white uppercase tracking-tight">
              🌟 Shared Course Preview
            </p>
            <p className="text-[10px] sm:text-xs font-bold text-black/70 dark:text-white/70">
              Save bookmarks • Take quizzes • Track progress
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default React.memo(SharedCourseBanner)
