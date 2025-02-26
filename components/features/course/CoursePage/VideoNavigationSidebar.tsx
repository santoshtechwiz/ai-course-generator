"use client"

import React from "react"
import { signIn, useSession } from "next-auth/react"
import { Lock, Info, PlayCircle, ChevronDown, CheckCircle, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TooltipProvider, TooltipContent, TooltipTrigger, Tooltip } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { FullCourseType, FullChapterType, CourseProgress } from "@/app/types/types"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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

  if (!showFullContent) {
    return (
      <div className="flex h-full items-center justify-center p-4 sm:p-6">
        <div className="text-center max-w-xs mx-auto">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Sign In Required</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Sign in to view the course playlist and track your progress.
          </p>
          <Button onClick={() => signIn(undefined, { callbackUrl: window.location.href })} className="w-full">
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col space-y-4 p-3 sm:p-4 lg:p-6">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight">Course Content</h2>
          {currentChapter && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
              Currently watching: {currentChapter.name}
            </p>
          )}
        </div>

        {progress && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Course Progress</h3>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">Course progress info</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Track your progress through the course</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Progress value={progress.progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {progress.completedChapters.length} of{" "}
                  {course.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0)} chapters
                </span>
                <span>{Math.round(progress.progress)}% complete</span>
              </div>
            </div>
          </>
        )}
      </div>

      <ScrollArea className="flex-1 border-t">
        <div className="space-y-2 p-2 sm:p-4">
          {course.courseUnits?.map((unit) => {
            const unitProgress = Array.isArray(progress?.completedChapters)
              ? progress.completedChapters.filter((id) => unit.chapters.some((chapter) => chapter.id === id)).length
              : 0
            const isCurrentUnit = unit.chapters.some((chapter) => chapter.id === currentChapter?.id)

            return (
              <Collapsible
                key={unit.id}
                defaultOpen={isCurrentUnit}
                className="rounded-lg border bg-card text-card-foreground shadow-sm"
              >
                <CollapsibleTrigger className="flex w-full items-center justify-between p-3 sm:p-4 hover:bg-accent/50 transition-colors rounded-t-lg">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-medium">{unit.name}</h3>
                    <Badge variant={isCurrentUnit ? "default" : "secondary"} className="ml-auto sm:ml-2">
                      {unitProgress}/{unit.chapters.length}
                    </Badge>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 ui-open:rotate-180" />
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <Progress value={(unitProgress / unit.chapters.length) * 100} className="h-1" />
                  <div className="p-2">
                    {unit.chapters.map((chapter) => {
                      const isCompleted = progress?.completedChapters.includes(chapter.id)
                      const isCurrent = chapter.videoId === currentVideoId
                      const isNext = chapter.videoId === nextVideoId
                      const isPrev = chapter.videoId === prevVideoId
                      const isQueued = !isCompleted && !isCurrent

                      return (
                        <motion.button
                          key={chapter.id}
                          onClick={() => chapter.videoId && onVideoSelect(chapter.videoId)}
                          className={cn(
                            "group relative w-full rounded-md p-2 text-left transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            isCurrent && "bg-primary text-primary-foreground",
                            isCompleted && !isCurrent && "text-muted-foreground",
                          )}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1 flex-shrink-0">
                              {isCurrent && (
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, ease: "easeInOut" }}
                                >
                                  <PlayCircle className="h-4 w-4 text-primary-foreground" />
                                </motion.div>
                              )}
                              {isCompleted && !isCurrent && <CheckCircle className="h-4 w-4 text-primary" />}
                              {isQueued && <Circle className="h-4 w-4 text-muted-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium line-clamp-1">{chapter.name}</span>
                                {isCurrent && (
                                  <Badge variant="secondary" className="ml-auto shrink-0">
                                    Playing
                                  </Badge>
                                )}
                              </div>
                              {chapter.description && (
                                <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                  {chapter.description}
                                </p>
                              )}
                            </div>
                            {(isNext || isPrev) && (
                              <div
                                className="absolute inset-y-0 w-1 bg-primary rounded-full"
                                style={{
                                  left: isPrev ? "auto" : 0,
                                  right: isPrev ? 0 : "auto",
                                }}
                              />
                            )}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}

export default React.memo(VideoNavigationSidebar)

