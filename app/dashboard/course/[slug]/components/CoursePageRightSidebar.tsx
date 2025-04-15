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
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface CoursePageRightSidebarProps {
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

function CoursePageRightSidebar({
  course,
  currentChapter,
  onVideoSelect,
  currentVideoId,
  isAuthenticated,
  progress,
  nextVideoId,
  prevVideoId,
}: CoursePageRightSidebarProps) {
  const { data: session } = useSession()
  const router = useRouter()

  const showFullContent = course.isPublic || isAuthenticated

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex flex-col space-y-4 p-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">{course.title}</h2>
          {currentChapter && <p className="text-sm text-muted-foreground">Currently watching: {currentChapter.name}</p>}
        </div>
        <Separator />
      </div>

      {showFullContent ? (
        <div className="flex-1 flex flex-col min-h-0 z-0">
          {progress && (
            <div className="px-6 pb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Course Progress</h3>
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-auto w-auto p-0 hover:bg-transparent">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">Course progress info</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Track your progress through the course</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Progress value={progress.progress} className="h-2" />
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {progress.completedChapters.length} /{" "}
                  {course.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0)} chapters
                </span>
                <span>{Math.round(progress.progress)}% complete</span>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1">
            <VideoPlaylist
              courseUnits={course.courseUnits}
              currentChapter={currentChapter}
              onVideoSelect={onVideoSelect}
              currentVideoId={currentVideoId}
              progress={progress}
              nextVideoId={nextVideoId}
              prevVideoId={prevVideoId}
            />
          </ScrollArea>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="rounded-full bg-muted p-3 w-12 h-12 mx-auto mb-4">
              <Lock className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight mb-2">Sign In Required</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-[250px] mx-auto">
              Sign in to view the course playlist and track your progress.
            </p>
            <Button onClick={() => signIn(undefined, { callbackUrl: window.location.href })} className="w-full">
              Sign In
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface VideoPlaylistProps {
  courseUnits: FullCourseType["courseUnits"]
  currentChapter?: FullChapterType
  onVideoSelect: (videoId: string) => void
  currentVideoId: string
  progress: CourseProgress | null
  nextVideoId?: string
  prevVideoId?: string
}

function VideoPlaylist(props: VideoPlaylistProps) {
  return (
    <div className="pb-6">
      <div className="space-y-2 px-4">
        {props.courseUnits?.map((unit, index) => {
          const unitProgress = Array.isArray(props.progress?.completedChapters)
            ? props.progress.completedChapters.filter((id) => unit.chapters.some((chapter) => chapter.id === id)).length
            : 0
          const isCurrentUnit = unit.chapters.some((chapter) => chapter.id === props.currentChapter?.id)

          return (
            <Collapsible
              key={unit.id}
              defaultOpen={isCurrentUnit}
              className="rounded-lg border bg-card text-card-foreground shadow-sm"
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-accent/50 transition-colors [&[data-state=open]>svg]:rotate-180">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium">{unit.title}</h3>
                  <Badge variant={isCurrentUnit ? "default" : "secondary"} className="ml-auto">
                    {unitProgress}/{unit.chapters.length}
                  </Badge>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
              </CollapsibleTrigger>

              <CollapsibleContent className="pb-4">
                <Progress value={(unitProgress / unit.chapters.length) * 100} className="h-1 mb-4" />

                <div className="space-y-1 px-4">
                  {unit.chapters.map((chapter) => {
                    const isCompleted = props.progress?.completedChapters.includes(chapter.id)
                    const isCurrent = chapter.videoId === props.currentVideoId
                    const isNext = chapter.videoId === props.nextVideoId
                    const isPrev = chapter.videoId === props.prevVideoId
                    const isQueued = !isCompleted && !isCurrent

                    return (
                      <button
                        key={chapter.id}
                        onClick={() => chapter.videoId && props.onVideoSelect(chapter.videoId)}
                        className={cn(
                          "group relative w-full rounded-md p-3 text-left transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isCurrent && "bg-primary text-primary-foreground hover:bg-primary/90",
                          isCompleted && !isCurrent && "text-muted-foreground hover:text-accent-foreground",
                          isNext &&
                            "after:absolute after:left-0 after:top-0 after:h-full after:w-1 after:bg-primary after:rounded-l-md",
                          isPrev &&
                            "after:absolute after:right-0 after:top-0 after:h-full after:w-1 after:bg-primary after:rounded-r-md",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {isCurrent && <PlayCircle className="h-4 w-4 text-primary-foreground animate-pulse" />}
                            {isCompleted && !isCurrent && <CheckCircle className="h-4 w-4 text-primary" />}
                            {isQueued && (
                              <Circle className="h-4 w-4 text-muted-foreground group-hover:text-accent-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium line-clamp-1">{chapter.name}</span>
                              {isCurrent && (
                                <Badge variant="secondary" className="ml-auto pointer-events-none">
                                  Playing
                                </Badge>
                              )}
                            </div>
                            {chapter.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 group-hover:text-accent-foreground">
                                {chapter.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </div>
    </div>
  )
}

export default React.memo(CoursePageRightSidebar)

