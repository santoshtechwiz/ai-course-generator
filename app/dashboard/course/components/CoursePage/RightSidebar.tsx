"use client"

import React, { useRef, useCallback, useMemo } from "react"
import { signIn, useSession } from "next-auth/react"
import { Lock, Info, PlayCircle, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TooltipProvider, TooltipContent, TooltipTrigger, Tooltip } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import type { FullCourseType, FullChapterType, CourseProgress } from "@/app/types"
import { useRouter } from "next/navigation"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface RightSidebarProps {
  course: FullCourseType
  currentChapter?: FullChapterType
  courseId: string
  onVideoSelect: (videoId: string) => void
  currentVideoId: string
  isAuthenticated: boolean
  courseOwnerId: string
  isSubscribed: boolean
  progress: CourseProgress | null
}

function RightSidebar({
  course,
  currentChapter,
  onVideoSelect,
  currentVideoId,
  isAuthenticated,
  courseOwnerId,
  isSubscribed,
  progress,
}: RightSidebarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const isOwner = session?.user?.id === courseOwnerId
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const handleVideoSelect = useCallback(
    (videoId: string) => {
      onVideoSelect(videoId)
    },
    [onVideoSelect],
  )

  const { totalChapters, unitProgresses } = useMemo(() => {
    let total = 0
    const unitProgresses =
      course.courseUnits?.map((unit) => {
        const chapters = unit.chapters.length
        total += chapters
        const completedInUnit = unit.chapters.filter((chapter) =>
          progress?.completedChapters.includes(chapter.id.toString()),
        ).length
        return {
          unitId: unit.id,
          progress: Math.round((completedInUnit / chapters) * 100),
          completedChapters: completedInUnit,
          totalChapters: chapters,
        }
      }) || []

    return { totalChapters: total, unitProgresses }
  }, [course.courseUnits, progress?.completedChapters])

  if (!isOwner && !isSubscribed) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold">{course.name}</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{isAuthenticated ? "Premium Content" : "Sign In Required"}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {isAuthenticated ? "Subscribe to access the full course content." : "Sign in to explore all courses."}
            </p>
            <Button
              onClick={() =>
                isAuthenticated
                  ? router.push("/dashboard/subscription")
                  : signIn(undefined, { callbackUrl: window.location.href })
              }
              className="w-full"
            >
              {isAuthenticated ? "Subscribe Now" : "Sign In"}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold">{course.name}</h1>
        {currentChapter && (
          <p className="text-sm text-muted-foreground mt-1">Currently watching: {currentChapter.name}</p>
        )}
      </div>

      {progress && (
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Course Progress</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Track your progress through the course</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Progress value={progress.progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2 flex justify-between">
            <span>
              {progress.completedChapters.length} / {totalChapters} chapters
            </span>
            <span>{Math.round(progress.progress)}%</span>
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {course.courseUnits?.map((unit, index) => {
            const unitProgress = unitProgresses.find((up) => up.unitId === unit.id)
            const isCurrentUnit = unit.chapters.some((chapter) => chapter.id === currentChapter?.id)

            return (
              <Collapsible
                key={unit.id}
                defaultOpen={isCurrentUnit}
                className="mb-4 bg-muted/30 rounded-lg overflow-hidden"
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold">{unit.name}</h3>
                    <Badge variant={isCurrentUnit ? "default" : "secondary"} className="ml-2">
                      {unitProgress?.completedChapters}/{unitProgress?.totalChapters}
                    </Badge>
                  </div>
                  {isCurrentUnit ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <Progress value={unitProgress?.progress} className="h-1 mt-2 mb-3" />

                  <div className="space-y-2 pl-4 pr-2 max-h-96 overflow-y-auto border-l-2 border-muted">
                    {unit.chapters.map((chapter) => {
                      const isCompleted = progress?.completedChapters.includes(chapter.id.toString())
                      const isCurrent = chapter.videoId === currentVideoId

                      return (
                        <button
                          key={chapter.id}
                          onClick={() => chapter.videoId && handleVideoSelect(chapter.videoId)}
                          className={`
                            w-full text-left p-3 rounded-lg
                            transition-all duration-200 ease-in-out
                            hover:bg-muted/50
                            ${isCurrent ? "bg-primary text-primary-foreground" : ""}
                            ${isCompleted && !isCurrent ? "text-muted-foreground" : ""}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`
                              flex-shrink-0 h-2 w-2 rounded-full
                              ${isCompleted ? "bg-primary" : "bg-muted-foreground"}
                              ${isCurrent ? "animate-pulse" : ""}
                            `}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="line-clamp-1">{chapter.name}</span>
                                {isCurrent && (
                                  <PlayCircle className="flex-shrink-0 h-4 w-4 text-primary-foreground animate-pulse" />
                                )}
                              </div>
                              {chapter.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
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
    </div>
  )
}

export default React.memo(RightSidebar)

