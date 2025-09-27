"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle2, Circle, PlayCircle, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
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

interface MobilePlaylistOverlayProps {
  isOpen: boolean
  onClose: () => void
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
}

const MobilePlaylistOverlay: React.FC<MobilePlaylistOverlayProps> = ({
  isOpen,
  onClose,
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
}) => {
  // Safe handler to select a chapter and close the overlay
  const handleChapterSelect = (chapter: Chapter) => {
    onChapterSelect(chapter)
    onClose()
  }
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="playlist-title"
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="absolute inset-0 bg-background flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold" id="playlist-title">{course.title}</h3>
                <div className="text-xs text-muted-foreground mt-1">
                  {courseStats.completedCount}/{courseStats.totalChapters} chapters completed • {courseStats.progressPercentage}% complete
                </div>
                <Progress value={courseStats.progressPercentage} className="h-1 mt-2" aria-label={`Course progress: ${courseStats.progressPercentage}%`} />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={onClose}
                aria-label="Close playlist"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Chapter list */}
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="p-4 divide-y divide-border">
                {course.chapters.map((chapter, index) => {
                  const isActive = String(currentChapter?.id) === String(chapter.id)
                  const isCompleted = completedChapters.includes(String(chapter.id))
                  
                  return (
                    <div
                      key={chapter.id}
                      className={cn(
                        "py-3 first:pt-0 last:pb-0",
                        isActive ? "bg-primary/10 border-l-4 border-primary/40 shadow-md" : ""
                      )}
                    >
                      <button
                        onClick={() => handleChapterSelect(chapter)}
                        className="flex items-start w-full text-left gap-3 overflow-hidden"
                      >
                        <div className="mt-1 flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : isActive ? (
                            <PlayCircle className="h-5 w-5 text-primary" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground/60" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-muted-foreground">
                              Chapter {index + 1}
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                          
                          <div
                            className={cn(
                              "font-medium mt-1 text-sm",
                              isActive ? "text-primary" : "",
                              isCompleted ? "text-primary/70" : ""
                            )}
                          >
                            {chapter.title}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 min-w-0">
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
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
            
            {/* Footer */}
            <div className="p-4 border-t">
              <Button onClick={onClose} variant="outline" className="w-full">
                Return to Course
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default React.memo(MobilePlaylistOverlay)
