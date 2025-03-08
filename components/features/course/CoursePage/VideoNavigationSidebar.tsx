"use client"

import React from "react"
import { signIn, useSession } from "next-auth/react"
import {
  Lock,
  PlayCircle,
  ChevronDown,
  CheckCircle,
  Clock,
  ListVideo,
  BarChart3,
  ChevronRight,
  ShieldAlert,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { FullCourseType, FullChapterType, CourseProgress } from "@/app/types/types"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface VideoNavigationSidebarProps {
  course: FullCourseType
  currentChapter?: FullChapterType
  courseId: string
  onVideoSelect: (videoId: string) => void
  currentVideoId: string
  isAuthenticated: boolean
  progress: CourseProgress | null
  nextVideoId?: string
  prevVideoId?: string
  completedChapters: string | string[]
}

function VideoNavigationSidebar({
  course,
  currentChapter,
  onVideoSelect,
  currentVideoId,
  isAuthenticated,
  progress,
  nextVideoId,
  prevVideoId,
}: VideoNavigationSidebarProps) {
  const { data: session } = useSession()
  const showFullContent = course.isPublic || isAuthenticated

  // Function to handle video selection that checks authentication
  const handleVideoSelect = (videoId: string) => {
    if (showFullContent) {
      onVideoSelect(videoId)
    } else {
      // Prevent video selection for non-authenticated users
      return false
    }
  }

  return (
    <div className="flex h-full flex-col bg-white rounded-lg border shadow-sm overflow-hidden">
      <div className="flex flex-col space-y-3 p-4 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListVideo className="h-5 w-5 text-blue-500" />
            <h2 className="text-base font-medium">Course Content</h2>
          </div>
          {showFullContent && progress && (
            <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100 border-0">
              {Math.round(progress.progress)}% complete
            </Badge>
          )}
          {!showFullContent && (
            <Badge className="bg-amber-100 text-amber-600 hover:bg-amber-100 border-0">
              <Lock className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>

        {currentChapter && (
          <p className="text-sm text-slate-500 line-clamp-1 pl-7">Currently watching: {currentChapter.title}</p>
        )}

        {showFullContent && progress && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-slate-400" />
                <h3 className="text-xs font-medium text-slate-500">Progress</h3>
              </div>
              <span className="text-xs text-slate-500">
                {progress.completedChapters.length}/
                {course.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0)} lessons
              </span>
            </div>
            <Progress value={progress.progress} className="h-1.5 bg-slate-200" />
          </div>
        )}

        {!showFullContent && (
          <div className="flex items-center justify-between pt-1">
            <div className="flex-1">
              <Button
                onClick={() => signIn(undefined, { callbackUrl: window.location.href })}
                className="w-full bg-blue-500 hover:bg-blue-600 text-sm h-8"
                size="sm"
              >
                Sign in to unlock
              </Button>
            </div>
          </div>
        )}
      </div>

      <Separator className="bg-slate-200" />

      <ScrollArea className="flex-1 relative">
        {!showFullContent && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 pointer-events-none flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90 opacity-70"></div>
          </div>
        )}

        <div className="p-2">
          {course.courseUnits?.map((unit) => {
            const isCurrentUnit = unit.chapters.some((chapter) => chapter.id === currentChapter?.id)

            return (
              <Collapsible key={unit.id} defaultOpen={isCurrentUnit} className="mb-1">
                <CollapsibleTrigger
                  className={cn(
                    "flex w-full items-center justify-between p-2 hover:bg-slate-50 transition-colors rounded-md",
                    !showFullContent && "opacity-70",
                  )}
                >
                  <h3 className="text-sm font-medium text-slate-700">{unit.title}</h3>
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 ui-open:rotate-180 text-slate-400" />
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="pl-2 pr-1 py-1">
                    {unit.chapters.map((chapter, index) => {
                      const isCompleted = showFullContent && progress?.completedChapters.includes(chapter.id)
                      const isCurrent = chapter.videoId === currentVideoId
                      const isNext = chapter.videoId === nextVideoId
                      const isQueued = !isCompleted && !isCurrent

                      const ChapterButton = () => (
                        <motion.div
                          className={cn(
                            "group relative w-full rounded-md p-2 text-left transition-colors",
                            showFullContent ? "hover:bg-slate-50" : "",
                            isCurrent && showFullContent && "bg-blue-50",
                            !showFullContent && "opacity-60 pointer-events-none",
                          )}
                          whileHover={showFullContent ? { scale: 1.01 } : {}}
                          whileTap={showFullContent ? { scale: 0.99 } : {}}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                              {showFullContent && isCurrent && <PlayCircle className="h-5 w-5 text-blue-500" />}
                              {showFullContent && isCompleted && !isCurrent && (
                                <CheckCircle className="h-5 w-5 text-blue-500" />
                              )}
                              {showFullContent && isQueued && <Clock className="h-5 w-5 text-slate-400" />}
                              {!showFullContent && <Lock className="h-4 w-4 text-slate-400" />}
                            </div>
                            <div className="flex-1 flex items-center justify-between min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={cn(
                                    "text-sm font-medium",
                                    showFullContent && isCurrent ? "text-blue-600" : "text-slate-700",
                                  )}
                                >
                                  {index + 1}.
                                </span>
                                <span
                                  className={cn(
                                    "text-sm line-clamp-1",
                                    showFullContent && isCurrent ? "text-blue-600" : "text-slate-700",
                                  )}
                                >
                                  {chapter.title}
                                </span>
                              </div>
                              <div className="ml-2 flex-shrink-0">
                                {showFullContent && isCurrent && (
                                  <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100 border-0">
                                    Now Playing
                                  </Badge>
                                )}
                                {showFullContent && isNext && (
                                  <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-0">
                                    Next
                                  </Badge>
                                )}
                                {showFullContent && !isCurrent && !isNext && (
                                  <ChevronRight
                                    className={cn(
                                      "h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity",
                                      isCompleted ? "text-blue-400" : "text-slate-400",
                                    )}
                                  />
                                )}
                                {!showFullContent && <Lock className="h-3 w-3 text-slate-400" />}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )

                      return showFullContent ? (
                        <div key={chapter.id} onClick={() => handleVideoSelect(chapter.videoId || "")}>
                          <ChapterButton />
                        </div>
                      ) : (
                        <TooltipProvider key={chapter.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <ChapterButton />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <div className="flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-amber-500" />
                                <span>Sign in to access this lesson</span>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      </ScrollArea>

      {!showFullContent && (
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Lock className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium">Premium Content</h3>
              <p className="text-xs text-slate-500 mt-0.5">Sign in to unlock all lessons and track your progress</p>
            </div>
            <Button
              onClick={() => signIn(undefined, { callbackUrl: window.location.href })}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600"
            >
              Sign In
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(VideoNavigationSidebar)

