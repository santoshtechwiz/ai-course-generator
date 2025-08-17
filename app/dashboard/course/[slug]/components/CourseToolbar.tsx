"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  Maximize2, 
  PictureInPicture, 
  Play,
  Monitor,
  StretchHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import CourseActions from './CourseActions'
import type { FullCourseType } from '@/app/types/types'
import { Switch } from '@/components/ui/switch'

interface CourseToolbarProps {
  course: FullCourseType
  isOwner: boolean
  wideMode: boolean
  isPiPActive: boolean
  autoplayMode: boolean
  onWideModeToggle: () => void
  onPIPToggle: (isPiPActive: boolean) => void
  onAutoplayToggle: () => void
  // New controls
  onTheaterModeToggle?: () => void
  onFullscreenToggle?: () => void
  isTheaterMode?: boolean
  isFullscreenActive?: boolean
}

export default function CourseToolbar({
  course,
  isOwner,
  wideMode,
  isPiPActive,
  autoplayMode,
  onWideModeToggle,
  onPIPToggle,
  onAutoplayToggle,
  onTheaterModeToggle,
  onFullscreenToggle,
  isTheaterMode,
  isFullscreenActive
}: CourseToolbarProps) {
  const router = useRouter()

  return (
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          
          <div className="flex items-center space-x-2">
            {/* Compact view-mode control group */}
            <div className="inline-flex items-center gap-1 rounded-md border bg-muted/50 p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onTheaterModeToggle}
                className={cn("h-8 w-8", isTheaterMode && "bg-primary/10 text-primary")}
                aria-label="Theater Mode"
                title="Theater Mode"
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onFullscreenToggle}
                className={cn("h-8 w-8", isFullscreenActive && "bg-primary/10 text-primary")}
                aria-label="Fullscreen"
                title="Fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onWideModeToggle}
                className={cn("h-8 w-8", wideMode && "bg-primary/10 text-primary")}
                aria-label="Wide Mode"
                title="Wide Mode"
              >
                <StretchHorizontal className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onPIPToggle(!isPiPActive)}
                className={cn("h-8 w-8", isPiPActive && "bg-primary/10 text-primary")}
                aria-label="Picture-in-Picture"
                title="Picture-in-Picture"
              >
                <PictureInPicture className="h-4 w-4" />
              </Button>
            </div>

            {/* Auto-play switch */}
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-muted-foreground">Auto‑play</span>
              <Switch checked={autoplayMode} onCheckedChange={() => onAutoplayToggle()} aria-label="Toggle auto-play" />
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <CourseActions slug={course.slug} title={course.title} isOwner={isOwner} />
        </div>
      </div>
    </div>
  )
}