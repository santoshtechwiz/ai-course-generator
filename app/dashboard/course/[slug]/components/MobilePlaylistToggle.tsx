"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import MobilePlaylistCount from '@/components/course/MobilePlaylistCount'
import type { FullChapterType } from '@/app/types/types'

interface MobilePlaylistToggleProps {
  onToggle: () => void
  currentIndex: number
  currentChapter?: FullChapterType | null
  totalVideos: number
}

const MobilePlaylistToggle: React.FC<MobilePlaylistToggleProps> = ({
  onToggle,
  currentIndex,
  currentChapter,
  totalVideos
}) => {
  return (
    <div className="mb-4 flex items-center justify-end">
      <div className="md:hidden w-full">
        <Button
          variant="outline"
          onClick={onToggle}
          className="w-full bg-background/80 backdrop-blur-sm border-primary/20 hover:bg-background/90 relative overflow-hidden"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Course Content</span>
            </div>
            <MobilePlaylistCount
              currentIndex={currentIndex}
              hasCurrentChapter={Boolean(currentChapter)}
              total={totalVideos}
            />
          </div>
        </Button>
      </div>
    </div>
  )
}

export default React.memo(MobilePlaylistToggle)