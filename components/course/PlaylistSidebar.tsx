"use client"

import React, { useMemo } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Circle, PlayCircle, BookOpen, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface Chapter {
  id: string
  title: string
  videoId?: string
  duration?: number
  isFree?: boolean
}

interface CourseType {
  id: string | number
  title: string
  chapters: Chapter[]
}

interface CourseStats {
  completedCount: number
  totalChapters: number
  progressPercentage: number
}

interface PlaylistSidebarProps {
  course: CourseType
  currentChapter: Chapter | null
  courseId: string
  currentVideoId: string
  isAuthenticated: boolean
  completedChapters: string[]
  formatDuration: (seconds: number) => string
  videoDurations: Record<string, number>
  courseStats: CourseStats
  onChapterSelect: (chapter: Chapter) => void
  isPiPActive: boolean
  lastPositions?: Record<string, number> // Add last positions for resume
  isLoading?: boolean // Add loading state
}

const PlaylistSidebar: React.FC<PlaylistSidebarProps> = ({
  course,
  currentChapter,
  courseId,
  currentVideoId,
  isAuthenticated,
  completedChapters,
  formatDuration,
  videoDurations,
  courseStats,
  onChapterSelect,
  isPiPActive,
  lastPositions = {},
  isLoading = false,
}) => {
  // Group chapters by their index (every 5 chapters)
  const chapterGroups = useMemo(() => {
    const groups: Chapter[][] = []
    let currentGroup: Chapter[] = []
    
    course.chapters.forEach((chapter, index) => {
      if (index % 5 === 0 && currentGroup.length > 0) {
        groups.push([...currentGroup])
        currentGroup = []
      }
      currentGroup.push(chapter)
    })
    
    if (currentGroup.length > 0) {
      groups.push([...currentGroup])
    }
    
    return groups
  }, [course.chapters])

  interface ChapterStatus {
    isCompleted: boolean;
    isCurrent: boolean;
    progress: number;
    hasProgress: boolean;
    duration: number;
    isFree: boolean;
  }

  // Get comprehensive status for a chapter
  const getChapterStatus = (chapter: Chapter): ChapterStatus => {
    // Check completion status - handle both string and number IDs
    const chapterId = String(chapter.id);
  const isCompleted = completedChapters.includes(chapterId);
  const isCurrent = String(currentChapter?.id) === String(chapter.id);
    
    // Get video duration and progress
    const duration = typeof videoDurations[chapter.videoId || ""] === 'number' 
      ? videoDurations[chapter.videoId || ""] 
      : (typeof chapter.duration === 'number' ? chapter.duration : 0);
    
    const lastPosition = lastPositions?.[chapterId];
    const progress = lastPosition && duration 
      ? Math.round((lastPosition / duration) * 100) 
      : 0;

    return {
      isCompleted,
      isCurrent,
      progress: Math.min(progress, 100), // Cap progress at 100%
      hasProgress: !!lastPosition && progress > 0,
      duration,
      isFree: !!chapter.isFree,
    }
  }
  
  // Determine sidebar animation
  const sidebarAnimation = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  }
  
  return (
    <motion.div
      key="playlist-sidebar"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={sidebarAnimation}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "rounded-xl border bg-card overflow-hidden h-full flex flex-col min-h-[500px] relative",
        isPiPActive ? "hidden" : "hidden md:flex"
      )}
    >
      {/* Sidebar header with progress */}
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-semibold line-clamp-1 text-base">{course.title}</h3>
        <div className="flex items-center justify-between mt-3 text-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="font-medium">{courseStats.completedCount}/{courseStats.totalChapters} completed</span>
          </div>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary font-semibold px-2 py-1">
            {courseStats.progressPercentage}%
          </Badge>
        </div>
        <Progress value={courseStats.progressPercentage} className="h-2 mt-3 bg-muted" />
        
        {/* Progress motivator */}
        <div className="mt-2 text-xs text-muted-foreground text-center">
          {courseStats.progressPercentage === 100 
            ? "🎉 Course completed!" 
            : courseStats.progressPercentage > 50 
              ? "Almost there! Keep going!" 
              : "Just getting started!"}
        </div>
      </div>

      {/* Chapter list */}
      <ScrollArea className="flex-1 overflow-hidden">
        <div className="p-4">
          {chapterGroups.map((group, groupIndex) => (
            <div key={`group-${groupIndex}`} className="mb-6 last:mb-0">
              <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Chapters {groupIndex * 5 + 1} - {groupIndex * 5 + group.length}
              </div>
              
              <div className="space-y-2">
                {group.map((chapter) => {
                  const status = getChapterStatus(chapter);
                  return (
                    <button
                      key={chapter.id}
                      onClick={() => onChapterSelect(chapter)}
                      className={cn(
                        "flex items-center w-full p-3 text-sm rounded-lg text-left gap-3 overflow-hidden",
                        "transition-all duration-200 group hover:shadow-sm",
                        status.isCurrent
                          ? "bg-primary/10 text-primary border-l-4 border-primary/50 shadow-lg"
                          : "hover:bg-muted/60 border border-transparent",
                      )}
                    >
                      <div className="flex-shrink-0">
                        {status.isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : status.isCurrent ? (
                          <PlayCircle className="h-5 w-5 text-primary" />
                        ) : status.hasProgress ? (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/60" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div
                          className={cn(
                            "font-medium line-clamp-2 leading-snug",
                            status.isCurrent ? "text-primary" : "text-foreground"
                          )}
                        >
                          {chapter.title}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                          {/* Free Badge */}
                          {status.isFree && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-green-200 text-green-700 bg-green-50">
                              Free
                            </Badge>
                          )}

                          {/* Duration and Progress Group */}
                          <div className="flex items-center gap-2 ml-auto min-w-0">
                            {/* Duration */}
                            {status.duration > 0 && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDuration(status.duration)}
                              </span>
                            )}

                            {/* Progress Badge */}
                            {status.isCompleted ? (
                              <Badge variant="default" className="bg-primary/20 text-primary text-xs flex items-center gap-1 max-w-[120px] truncate">
                                <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">Completed</span>
                              </Badge>
                            ) : status.hasProgress ? (
                              <Badge variant="secondary" className="text-xs flex items-center gap-1 max-w-[140px]">
                                <span className="flex-shrink-0">{status.progress}%</span>
                                <Progress value={status.progress} className="w-12 h-1 min-w-[32px]" />
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Loading States */}
      {isLoading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
          />
          <span className="mt-2 text-sm text-muted-foreground">
            Updating progress...
          </span>
          <Progress 
            value={courseStats.progressPercentage} 
            className="w-48 mt-4"
          />
          <span className="text-xs text-muted-foreground mt-2">
            {courseStats.completedCount} of {courseStats.totalChapters} chapters completed
          </span>
        </motion.div>
      )}
    </motion.div>
  )
}

export default React.memo(PlaylistSidebar)
