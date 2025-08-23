"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CheckCircle, ChevronDown, ChevronRight, Clock, Lock, Play } from 'lucide-react'
import { motion } from 'framer-motion'

interface PlaylistChapter {
  id: string
  title: string
  videoId?: string
  duration?: number
  isLocked?: boolean
}

interface PlaylistUnit {
  title: string
  chapters: PlaylistChapter[]
}

interface EnhancedPlaylistSidebarProps {
  courseId: string
  courseTitle: string
  units: PlaylistUnit[]
  currentChapterId?: string | null
  completedChapters: string[]
  onChapterSelect: (chapter: PlaylistChapter) => void
  formatDuration: (seconds: number) => string
  progress: {
    completedCount: number
    totalChapters: number
    progressPercentage: number
  }
  isPremiumContent?: boolean
  isAuthenticated?: boolean
  userHasAccess?: boolean
}

export function EnhancedPlaylistSidebar({
  courseId,
  courseTitle,
  units,
  currentChapterId,
  completedChapters,
  onChapterSelect,
  formatDuration,
  progress,
  isPremiumContent = false,
  isAuthenticated = true,
  userHasAccess = true
}: EnhancedPlaylistSidebarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="course-sidebar"
    >
      <div className="p-4 border-b">
        <h3 className="font-medium text-lg">Course Content</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <span>{progress.totalChapters} chapters</span>
          <span>•</span>
          <span>{progress.completedCount} completed</span>
          <span>•</span>
          <span>{progress.progressPercentage}%</span>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-14rem)] pb-6">
        <div className="p-0">
          {units.map((unit, unitIndex) => (
            <Collapsible
              key={`${courseId}-unit-${unitIndex}`}
              defaultOpen={true}
              className="border-b last:border-b-0"
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 rounded-none h-auto"
                >
                  <div className="flex flex-col items-start text-left">
                    <div className="font-medium">{unit.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {unit.chapters.length} chapters
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ui-open:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                {unit.chapters.map((chapter, chapterIndex) => {
                  const isActive = chapter.id === currentChapterId
                  const isCompleted = completedChapters.includes(chapter.id)
                  const isLocked = chapter.isLocked || (isPremiumContent && !userHasAccess && chapterIndex >= 2)

                  return (
                    <div
                      key={chapter.id}
                      className={cn(
                        "pl-4 pr-2 py-3 flex items-center gap-3 cursor-pointer hover:bg-accent/10 transition-colors",
                        isActive && "course-chapter-active",
                        isCompleted && !isActive && "course-chapter-completed",
                        isLocked && "course-chapter-locked"
                      )}
                      onClick={() => !isLocked && onChapterSelect(chapter)}
                    >
                      <div className="flex-shrink-0">
                        {isLocked ? (
                          <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          </div>
                        ) : isCompleted ? (
                          <div className="h-5 w-5 rounded-full bg-success/20 text-success flex items-center justify-center">
                            <CheckCircle className="h-3 w-3" />
                          </div>
                        ) : isActive ? (
                          <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Play className="h-3 w-3 ml-0.5" />
                          </div>
                        ) : (
                          <div className="chapter-progress-indicator bg-muted text-muted-foreground">
                            {unitIndex + 1}.{chapterIndex + 1}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {chapter.title}
                        </div>
                        {chapter.duration && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Clock className="h-3 w-3" />
                            <span>{formatDuration(chapter.duration)}</span>
                          </div>
                        )}
                      </div>

                      {isLocked && !userHasAccess && (
                        <div className="text-xs font-medium text-muted-foreground">
                          Premium
                        </div>
                      )}
                    </div>
                  )
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  )
}
