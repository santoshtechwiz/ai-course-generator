"use client"

import React, { useMemo } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Circle, PlayCircle, BookOpen } from "lucide-react"
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
        "rounded-xl border bg-card overflow-hidden h-full flex flex-col",
        isPiPActive ? "hidden" : "hidden md:flex"
      )}
    >
      {/* Sidebar header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold line-clamp-1">{course.title}</h3>
        <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            <span>{courseStats.completedCount}/{courseStats.totalChapters} completed</span>
          </div>
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
            {courseStats.progressPercentage}%
          </Badge>
        </div>
        <Progress value={courseStats.progressPercentage} className="h-1 mt-3" />
      </div>
      
      {/* Chapter list */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {chapterGroups.map((group, groupIndex) => (
            <div key={`group-${groupIndex}`} className="mb-6">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Chapters {groupIndex * 5 + 1} - {groupIndex * 5 + group.length}
              </div>
              
              <div className="space-y-1">
                {group.map((chapter) => {
                  const isActive = currentChapter?.id === chapter.id
                  const isCompleted = completedChapters.includes(String(chapter.id))
                  
                  return (
                    <button
                      key={chapter.id}
                      onClick={() => onChapterSelect(chapter)}
                      className={cn(
                        "flex items-center w-full p-2 text-sm rounded-lg text-left gap-2",
                        "transition-colors duration-150 group",
                        isActive
                          ? "bg-primary/10 text-primary hover:bg-primary/15"
                          : "hover:bg-muted/50",
                        isCompleted ? "text-primary/70" : "text-foreground"
                      )}
                    >
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : isActive ? (
                          <PlayCircle className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/60" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            "font-medium line-clamp-2",
                            isActive ? "text-primary" : ""
                          )}
                        >
                          {chapter.title}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          {chapter.isFree && (
                            <Badge variant="outline" className="text-[10px] py-0 border-primary/30 text-primary bg-primary/5">
                              Free
                            </Badge>
                          )}
                          {(videoDurations[chapter.videoId || ""] || chapter.duration) && (
                            <span>
                              {formatDuration(
                                typeof videoDurations[chapter.videoId || ""] === 'number' 
                                  ? videoDurations[chapter.videoId || ""] 
                                  : (typeof chapter.duration === 'number' ? chapter.duration : 0)
                              )}
                            </span>
                          )}
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
    </motion.div>
  )
}

export default React.memo(PlaylistSidebar)
