"use client"

import React from "react"
import { signIn, useSession } from "next-auth/react"
import { Lock, PlayCircle, ChevronDown, CheckCircle, ListVideo, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { FullCourseType, FullChapterType, CourseProgress } from "@/app/types/types"
import { cn } from "@/lib/utils"
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

  return (
    <div className="flex h-full flex-col border-l border-border bg-background">
      <div className="flex flex-col space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListVideo className="h-5 w-5 text-primary" />
            <h2 className="text-base font-medium text-foreground">Course Content</h2>
          </div>
          {showFullContent && progress && (
            <Badge variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
              {Math.round(progress.progress)}% complete
            </Badge>
          )}
        </div>

        {currentChapter && (
          <div className="flex items-center gap-2">
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground line-clamp-1">Currently watching: {currentChapter.title}</p>
          </div>
        )}

        {showFullContent && progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Progress</span>
              </div>
              <span className="text-muted-foreground">
                {progress.completedChapters.length}/
                {course.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0)} lessons
              </span>
            </div>
            <Progress value={progress.progress} className="h-1" />
          </div>
        )}
      </div>

      <Separator className="bg-border" />

      <ScrollArea className="flex-1">
        <div className="p-4">
          {course.courseUnits?.map((unit) => {
            const isCurrentUnit = unit.chapters.some((chapter) => chapter.id === currentChapter?.id)

            return (
              <Collapsible key={unit.id} defaultOpen={isCurrentUnit} className="space-y-2">
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground">
                  {unit.title}
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 ui-open:rotate-180" />
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-1">
                  {unit.chapters.map((chapter, index) => {
                    const isCompleted = showFullContent && progress?.completedChapters.includes(chapter.id)
                    const isCurrent = chapter.videoId === currentVideoId
                    const isNext = chapter.videoId === nextVideoId

                    return (
                      <button
                        key={chapter.id}
                        onClick={() => showFullContent && onVideoSelect(chapter.videoId || "")}
                        disabled={!showFullContent}
                        className={cn(
                          "group relative w-full rounded-md p-2 text-left text-sm transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                          isCurrent && "bg-accent text-accent-foreground",
                          !showFullContent && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-5 w-5 items-center justify-center">
                            {showFullContent ? (
                              isCurrent ? (
                                <PlayCircle className="h-4 w-4 text-primary" />
                              ) : isCompleted ? (
                                <CheckCircle className="h-4 w-4 text-primary" />
                              ) : (
                                <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                              )
                            ) : (
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <span
                            className={cn(
                              "flex-1 truncate text-foreground",
                              isCurrent && "text-accent-foreground font-medium",
                            )}
                          >
                            {index + 1}. {chapter.title}
                          </span>
                          {isNext && (
                            <Badge variant="outline" className="ml-2 bg-muted text-muted-foreground border-muted">
                              Next
                            </Badge>
                          )}
                          {isCurrent && (
                            <Badge variant="outline" className="ml-2 bg-primary/10 text-primary border-primary/20">
                              Now Playing
                            </Badge>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </CollapsibleContent>
              </Collapsible>
            )
          })}
        </div>
      </ScrollArea>

      {!showFullContent && (
        <div className="p-4 border-t border-border">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 rounded-full p-2 bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-card-foreground">Premium Content</h3>
                <p className="text-sm text-muted-foreground">Sign in to access all lessons</p>
              </div>
              <Button onClick={() => signIn(undefined, { callbackUrl: window.location.href })}>Sign In</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(VideoNavigationSidebar)

