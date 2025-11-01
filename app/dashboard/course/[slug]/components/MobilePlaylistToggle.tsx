"use client"

import React from "react"
import { BookOpen, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui"
import { cn } from "@/lib/utils"
import MobilePlaylistCount from "@/components/course/MobilePlaylistCount"
import type { FullChapterType } from "@/app/types/types"

interface MobilePlaylistToggleProps {
  currentChapter: FullChapterType | null | undefined
  currentIndex: number
  totalVideos: number
  isOpen: boolean
  onToggle: () => void
}

/**
 * MobilePlaylistToggle Component
 * 
 * Mobile-only button to toggle the chapter playlist overlay.
 * Shows current chapter and progress count.
 */
export function MobilePlaylistToggle({
  currentChapter,
  currentIndex,
  totalVideos,
  isOpen,
  onToggle,
}: MobilePlaylistToggleProps) {
  return (
    <div className="xl:hidden border-b-4 border-black dark:border-white bg-white dark:bg-gray-900">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <Button
          variant="neutral"
          onClick={onToggle}
          className="w-full justify-between h-12 sm:h-14 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-800 border-3 border-black dark:border-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.8)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all font-black rounded-none group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-cyan-500 dark:bg-cyan-600 border-3 border-black dark:border-white flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <BookOpen className="h-4 w-4 text-black dark:text-white" />
            </div>
            <div className="text-left">
              <div className="font-black uppercase text-xs text-black dark:text-white">Course Content</div>
              <div className="text-[10px] font-bold text-gray-600 dark:text-gray-400 line-clamp-1">
                {currentChapter?.title || "Select a chapter"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <MobilePlaylistCount
              currentIndex={currentIndex}
              hasCurrentChapter={Boolean(currentChapter)}
              total={totalVideos}
            />
            <ChevronDown className={cn(
              "h-4 w-4 text-black dark:text-white transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </div>
        </Button>
      </div>
    </div>
  )
}

export default React.memo(MobilePlaylistToggle)
