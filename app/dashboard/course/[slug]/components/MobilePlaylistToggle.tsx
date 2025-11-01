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
    <div className="xl:hidden border-b-4 border-[hsl(var(--border))] bg-[hsl(var(--surface))]">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <Button
          variant="neutral"
          onClick={onToggle}
          className="w-full justify-between h-12 sm:h-14 bg-[hsl(var(--accent))]/10 hover:bg-[hsl(var(--accent))]/20 border-3 border-[hsl(var(--border))] shadow-neo hover:shadow-neo-hover hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all font-black rounded-none group focus-visible:ring-4 focus-visible:ring-[hsl(var(--accent))]/50 focus-visible:outline-none"
          aria-label={isOpen ? "Close playlist" : "Open playlist"}
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[hsl(var(--accent))] border-3 border-[hsl(var(--border))] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <BookOpen className="h-4 w-4 text-[hsl(var(--foreground))]" />
            </div>
            <div className="text-left">
              <div className="font-black uppercase text-xs text-[hsl(var(--foreground))]">Course Content</div>
              <div className="text-[10px] font-bold text-[hsl(var(--foreground))]/60 line-clamp-1">
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
              "h-4 w-4 text-[hsl(var(--foreground))] transition-transform duration-200",
              isOpen && "rotate-180"
            )} />
          </div>
        </Button>
      </div>
    </div>
  )
}

export default React.memo(MobilePlaylistToggle)
