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
        "rounded-xl border bg-card overflow-hidden h-full flex flex-col min-h-[500px]",
        isPiPActive ? "hidden" : "hidden md:flex"
      )}
    >
      {/* Sidebar header */}
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
      <ScrollArea className="flex-1">
        <div className="p-4">
          {chapterGroups.map((group, groupIndex) => (
            <div key={`group-${groupIndex}`} className="mb-6">
              <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                Chapters {groupIndex * 5 + 1} - {groupIndex * 5 + group.length}
              </div>
              
              <div className="space-y-2">
                {group.map((chapter) => {
                  const isActive = currentChapter?.id === chapter.id
                  const isCompleted = completedChapters.includes(String(chapter.id))
                  
                  return (
                    <button
                      key={chapter.id}
                      onClick={() => onChapterSelect(chapter)}
                      className={cn(
                        "flex items-center w-full p-3 text-sm rounded-lg text-left gap-3",
                        "transition-all duration-200 group hover:shadow-sm",
                        isActive
                          ? "bg-primary/15 text-primary border border-primary/20 shadow-sm"
                          : "hover:bg-muted/60 border border-transparent",
                        isCompleted ? "text-foreground" : "text-foreground"
                      )}
                    >
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : isActive ? (
                          <PlayCircle className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/60" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            "font-medium line-clamp-2 leading-snug",
                            isActive ? "text-primary" : "text-foreground"
                          )}
                        >
                          {chapter.title}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                          {chapter.isFree && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-green-200 text-green-700 bg-green-50">
                              Free
                            </Badge>
                          )}
                          {(videoDurations[chapter.videoId || ""] || chapter.duration) && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(
                                typeof videoDurations[chapter.videoId || ""] === 'number' 
                                  ? videoDurations[chapter.videoId || ""] 
                                  : (typeof chapter.duration === 'number' ? chapter.duration : 0)
                              )}
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-green-600 font-medium">✓ Completed</span>
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
