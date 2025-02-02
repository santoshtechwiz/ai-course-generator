import React from "react"
import { signIn, useSession } from "next-auth/react"
import { Lock, Info, PlayCircle, ChevronDown, ChevronRight, CheckCircle, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TooltipProvider, TooltipContent, TooltipTrigger, Tooltip } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import type { FullCourseType, FullChapterType, CourseProgress } from "@/app/types/types"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

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
  nextVideoId?: string
  prevVideoId?: string,
  completedChapters: string | string[]
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
  nextVideoId,
  prevVideoId,
}: RightSidebarProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const isOwner = session?.user?.id === courseOwnerId

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
              {progress.completedChapters.length} /{" "}
              {course.courseUnits?.reduce((acc, unit) => acc + unit.chapters.length, 0)} chapters
            </span>
            <span>{Math.round(progress.progress)}%</span>
          </p>
        </div>
      )}


      <VideoPlaylist courseUnits={course.courseUnits} currentChapter={currentChapter} onVideoSelect={onVideoSelect} currentVideoId={currentVideoId} progress={progress} nextVideoId={nextVideoId} prevVideoId={prevVideoId}></VideoPlaylist>
    </div>
  )
}


interface VideoPlaylistProps {
  courseUnits: FullCourseType['courseUnits'];
  currentChapter?: FullChapterType;
  onVideoSelect: (videoId: string) => void;
  currentVideoId: string;
  progress: CourseProgress | null;
  nextVideoId?: string;
  prevVideoId?: string;
}

function VideoPlaylist(props: VideoPlaylistProps) {
  return (<div className="flex-1 overflow-y-auto">
    <div className="p-4">
      {props.courseUnits?.map((unit, index) => {
        const unitProgress = Array.isArray(props.progress?.completedChapters) ? props.progress.completedChapters.filter(id => unit.chapters.some(chapter => chapter.id === id)).length : 0;
        const isCurrentUnit = unit.chapters.some(chapter => chapter.id === props.currentChapter?.id);
        return <Collapsible key={unit.id} defaultOpen={isCurrentUnit} className="mb-4 bg-muted/30 rounded-lg overflow-hidden">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">{unit.name}</h3>
              <Badge variant={isCurrentUnit ? "default" : "secondary"} className="ml-2">
                {unitProgress}/{unit.chapters.length}
              </Badge>
            </div>
            {isCurrentUnit ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </CollapsibleTrigger>

          <CollapsibleContent>
            <Progress value={unitProgress / unit.chapters.length * 100} className="h-1 mt-2 mb-3" />

            <div className="space-y-2 pl-4 pr-2 max-h-96 overflow-y-auto border-l-2 border-muted">
              {unit.chapters.map(chapter => {
                const isCompleted = props.progress?.completedChapters.includes(chapter.id);
                const isCurrent = chapter.videoId === props.currentVideoId;
                const isNext = chapter.videoId === props.nextVideoId;
                const isPrev = chapter.videoId === props.prevVideoId;
                const isQueued = !isCompleted && !isCurrent;
                return <button key={chapter.id} onClick={() => chapter.videoId && props.onVideoSelect(chapter.videoId)} className={cn("w-full text-left p-3 rounded-lg transition-all duration-200 ease-in-out", "hover:bg-muted/50 flex items-center gap-3", isCurrent && "bg-primary text-primary-foreground", isCompleted && !isCurrent && "text-muted-foreground", isNext && "border-l-2 border-primary", isPrev && "border-r-2 border-primary")}>
                  <div className="flex-shrink-0">
                    {isCurrent && <PlayCircle className="h-5 w-5 text-primary-foreground animate-pulse" />}
                    {isCompleted && !isCurrent && <CheckCircle className="h-5 w-5 text-primary" />}
                    {isQueued && <Circle className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="line-clamp-1 font-medium">{chapter.name}</span>
                      {isCurrent && <Badge variant="secondary" className="ml-2">
                        Playing
                      </Badge>}
                    </div>
                    {chapter.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{chapter.description}</p>}
                  </div>
                </button>;
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>;
      })}
    </div>
  </div>);
}

export default React.memo(RightSidebar)

