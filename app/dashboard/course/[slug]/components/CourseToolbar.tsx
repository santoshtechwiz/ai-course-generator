"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  Maximize2, 
  PictureInPicture, 
  Play 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import CourseActions from './CourseActions'
import type { FullCourseType } from '@/app/types/types'

interface CourseToolbarProps {
  course: FullCourseType
  isOwner: boolean
  wideMode: boolean
  isPiPActive: boolean
  autoplayMode: boolean
  onWideModeToggle: () => void
  onPIPToggle: (isPiPActive: boolean) => void
  onAutoplayToggle: () => void
}

export default function CourseToolbar({
  course,
  isOwner,
  wideMode,
  isPiPActive,
  autoplayMode,
  onWideModeToggle,
  onPIPToggle,
  onAutoplayToggle
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
            <Button
              variant="ghost"
              size="sm"
              onClick={onWideModeToggle}
              className={cn(
                "flex items-center space-x-2",
                wideMode && "bg-primary/10 text-primary"
              )}
            >
              <Maximize2 className="h-4 w-4" />
              <span>Wide Mode</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPIPToggle(!isPiPActive)}
              className={cn(
                "flex items-center space-x-2",
                isPiPActive && "bg-primary/10 text-primary"
              )}
            >
              <PictureInPicture className="h-4 w-4" />
              <span>PIP</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onAutoplayToggle}
              className={cn(
                "flex items-center space-x-2",
                autoplayMode && "bg-green-500/10 text-green-600"
              )}
            >
              <Play className="h-4 w-4" />
              <span>Auto-play</span>
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isPiPActive && (
            <div className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
              PIP Active
            </div>
          )}
          
          {autoplayMode && (
            <div className="px-3 py-1 bg-green-500/10 text-green-600 text-sm rounded-full">
              Auto-play Mode
            </div>
          )}
          
          <CourseActions course={course} isOwner={isOwner} />
        </div>
      </div>
    </div>
  )
}