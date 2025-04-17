"use client"

import React from "react"
import { signIn, useSession } from "next-auth/react"
import { Lock, PlayCircle, ChevronDown, CheckCircle, ListVideo, BarChart3, LogIn } from "lucide-react"
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
      <div className="flex flex-col space-y-4 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <ListVideo className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-base font-medium text-foreground">Course Content</h2>
          </div>
          {showFullContent && progress && (
            <Badge variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
              {Math.round(progress.progress)}% complete
            </Badge>
          )}
        </div>

        {currentChapter && (
          <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
            <PlayCircle className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium line-clamp-1">Currently watching: {currentChapter.title}</p>
          </div>
        )}

        {showFullContent && progress && (
          <div className="space-y-2 bg-muted/30 p-3 rounded-md">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Progress</span>
              </div>
              <span className="text-muted-foreground font-medium">
                {progress.completedChapters.length}/
                {course.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0)} lessons
              </span>
            </div>
            <Progress value={progress.progress} className="h-1.5 rounded-full" />
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
                          "group relative w-full rounded-md p-3 text-left text-sm transition-all duration-200",
                          "hover:bg-accent hover:text-accent-foreground",
                          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                          isCurrent && "bg-accent/70 text-accent-foreground",
                          !showFullContent && "cursor-not-allowed opacity-60",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-6 w-6 items-center justify-center shrink-0">
                            {showFullContent ? (
                              isCurrent ? (
                                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                                  <PlayCircle className="h-4 w-4 text-primary" />
                                </div>
                              ) : isCompleted ? (
                                <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                              ) : (
                                <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 flex items-center justify-center">
                                  <div className="h-2 w-2 rounded-full bg-muted-foreground/70" />
                                </div>
                              )
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <span className={cn("flex-1 truncate", isCurrent && "font-medium")}>
                            {index + 1}. {chapter.title}
                          </span>
                          {isNext && (
                            <Badge
                              variant="outline"
                              className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                            >
                              Next
                            </Badge>
                          )}
                          {isCurrent && (
                            <Badge
                              variant="outline"
                              className="ml-2 bg-primary/10 text-primary border-primary/20 animate-pulse"
                            >
                              Playing
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
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 rounded-full p-3 bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-lg text-card-foreground">Premium Content</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Sign in to access all lessons and track your progress
                </p>
              </div>
            </div>
            <Button
              onClick={() => signIn(undefined, { callbackUrl: window.location.href })}
              className="w-full"
              size="lg"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Sign In to Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(VideoNavigationSidebar)
