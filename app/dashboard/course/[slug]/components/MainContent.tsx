"use client"

import { Suspense, useCallback, useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { ErrorBoundary } from "react-error-boundary"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Loader2 } from "lucide-react"
import CourseDetailsTabs from "./CourseDetailsTabs"
import CourseActionsWithErrorBoundary from "./CourseActions"
import { useSession } from "next-auth/react"
import { CourseCompletionOverlay } from "./CourseCompletionOverlay"
import { Skeleton } from "@/components/ui/skeleton"

import type { FullCourseType, FullChapter, FullChapterType } from "@/app/types/types"
import type { CourseProgress } from "@prisma/client"

// Dynamically import the video player for better performance
const EnhancedVideoPlayer = dynamic(() => import("./EnhancedVideoPlayer"), {
  ssr: false,
  loading: () => <VideoPlayerSkeleton />,
})

interface ChapterInfoProps {
  course: FullCourseType
  currentChapter?: FullChapter
}

interface MainContentProps {
  course: FullCourseType
  initialVideoId?: string
  nextVideoId?: string
  prevVideoId?: string
  onVideoEnd?: () => void
  onVideoSelect: (videoId: string) => void
  currentChapter?: FullChapter
  currentTime: number
  onTimeUpdate: (time: number) => void
  progress?: Partial<CourseProgress>
  onChapterComplete?: (chapterId: number) => void
  planId?: string
  isLastVideo: boolean
  onWatchAnotherCourse: () => void
}

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => (
  <Card className="border-red-300">
    <CardContent className="p-6">
      <div className="flex items-center space-x-2 text-red-600 mb-4">
        <AlertTriangle className="w-5 h-5" />
        <h2 className="text-lg font-semibold">Something went wrong</h2>
      </div>
      <p className="mb-4 text-muted-foreground">{error.message}</p>
      <div className="space-x-4">
        <Button onClick={resetErrorBoundary} variant="secondary">
          Try again
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh page
        </Button>
      </div>
    </CardContent>
  </Card>
)

const VideoPlayerSkeleton = () => <div className="aspect-video animate-pulse bg-muted rounded-lg" />

const ChapterInfo = ({ course, currentChapter }: ChapterInfoProps) => (
  <div className="space-y-2 p-4 lg:p-6">
    <h1 className="text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl lg:text-4xl">{course.title}</h1>
    {currentChapter ? (
      <p className="text-sm text-muted-foreground sm:text-base md:text-lg lg:text-xl">{currentChapter.title}</p>
    ) : (
      <Skeleton className="h-4 w-48" /> // Loading state
    )}
  </div>
)

interface VideoPlayerProps {
  initialVideoId?: string
  currentChapter?: FullChapter
  onVideoEnd?: () => void
  currentTime: number
  onTimeUpdate: (time: number) => void
  onChapterComplete?: (chapterId: number) => void
  course: FullCourseType
  onVideoSelect: (videoId: string) => void
  isLastVideo: boolean
  onWatchAnotherCourse: () => void
}

const VideoPlayer = ({
  initialVideoId,
  currentChapter,
  onVideoEnd,
  currentTime,
  onTimeUpdate,
  onChapterComplete,
  course,
  onVideoSelect,
  isLastVideo,
  onWatchAnotherCourse,
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLDivElement>(null)
  const [currentVideoId, setCurrentVideoId] = useState(initialVideoId)
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false)

  useEffect(() => {
    setCurrentVideoId(initialVideoId)
  }, [initialVideoId])

  useEffect(() => {
    if (isLastVideo) {
      setShowCompletionOverlay(true)
    }
  }, [isLastVideo])

  useEffect(() => {
    if (videoRef.current) {
      const player = videoRef.current.querySelector("video")
      if (player) {
        player.currentTime = currentTime
      }
    }
  }, [currentTime])

  const handleVideoEnd = useCallback(() => {
    if (currentChapter && onChapterComplete) {
      onChapterComplete(currentChapter.id)
    }

    const currentUnitIndex = course.courseUnits.findIndex((unit) =>
      unit.chapters.some((chapter) => chapter.videoId === currentVideoId),
    )

    if (currentUnitIndex !== -1) {
      const currentUnit = course.courseUnits[currentUnitIndex]
      const currentChapterIndex = currentUnit.chapters.findIndex((chapter) => chapter.videoId === currentVideoId)

      if (currentChapterIndex !== -1) {
        const nextChapterIndex = currentChapterIndex + 1
        if (nextChapterIndex < currentUnit.chapters.length) {
          const nextChapter = currentUnit.chapters[nextChapterIndex]
          if (nextChapter.videoId) {
            setCurrentVideoId(nextChapter.videoId)
            onVideoSelect(nextChapter.videoId)
            return
          }
        } else {
          const nextUnitIndex = currentUnitIndex + 1
          if (nextUnitIndex < course.courseUnits.length) {
            const nextUnit = course.courseUnits[nextUnitIndex]
            const firstChapterWithVideo = nextUnit.chapters.find((chapter) => chapter.videoId)
            if (firstChapterWithVideo && firstChapterWithVideo.videoId) {
              setCurrentVideoId(firstChapterWithVideo.videoId)
              onVideoSelect(firstChapterWithVideo.videoId)
              return
            }
          }
        }
      }
    }

    if (onVideoEnd) {
      onVideoEnd()
    }

    if (isLastVideo) {
      setShowCompletionOverlay(true)
    }
  }, [currentVideoId, currentChapter, course, onChapterComplete, onVideoSelect, onVideoEnd, isLastVideo])

  const handleCloseOverlay = () => {
    setShowCompletionOverlay(false)
  }

  const handleDownloadCertificate = () => {
    console.log("Downloading certificate for course:", course.title)
    alert(`Certificate for ${course.title} is being downloaded.`)
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
      <Suspense fallback={<VideoPlayerSkeleton />}>
        <EnhancedVideoPlayer
          videoId={currentVideoId || ""}
          onEnded={handleVideoEnd}
          autoPlay={true}
          initialTime={currentTime}
          onProgress={onTimeUpdate}
          isLastVideo={isLastVideo}
          onDownloadCertificate={handleDownloadCertificate}
          onVideoSelect={onVideoSelect}
          playerConfig={{
            showRelatedVideos: false,
            rememberPosition: true,
            rememberMute: true,
            showCertificateButton: isLastVideo,
          }}
          courseAIVideos={course.courseUnits.flatMap((unit) =>
            unit.chapters.map((chapter) => ({
              id: chapter.videoId || "",
              title: chapter.name,
            })),
          )}
          courseName={course.title}
        />
        {showCompletionOverlay && (
          <CourseCompletionOverlay
            onClose={handleCloseOverlay}
            onWatchAnotherCourse={onWatchAnotherCourse}
            courseName={course.title}
          />
        )}
      </Suspense>
    </ErrorBoundary>
  )
}

interface QuizSectionTabsProps {
  course: FullCourseType
  currentChapter?: FullChapter
  planId?: string
}

const QuizSectionTabs = ({ course, currentChapter, planId }: QuizSectionTabsProps) => {
  return (
    <Card className="mt-8">
      <CardContent className="p-0">
        <CourseDetailsTabs
          chapterId={currentChapter?.id ?? 0}
          name={currentChapter?.title || "Chapter Details"}
          course={course}
          chapter={currentChapter as FullChapterType}
        />
      </CardContent>
    </Card>
  )
}

function LoadingFallback({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      <span>{message}</span>
    </div>
  )
}

export default function MainContent(props: MainContentProps) {
  const { data: session } = useSession()
  const isOwner = session?.user?.id === props.course.userId

  return (
    <div className="min-h-full flex flex-col bg-background">
      <ChapterInfo course={props.course} currentChapter={props.currentChapter} />

      <div className="flex-1">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container px-4">
            {isOwner && (
              <div className="py-4">
                <ErrorBoundary FallbackComponent={ErrorFallback}>
                  <Suspense fallback={<LoadingFallback message="Loading actions..." />}>
                    <CourseActionsWithErrorBoundary slug={props.course.slug || ""} />
                  </Suspense>
                </ErrorBoundary>
              </div>
            )}
          </div>
        </header>

        <main className="container px-4 py-6 flex flex-col gap-6">
          <div className="mx-auto max-w-[1200px] w-full space-y-6">
            <div className="overflow-hidden rounded-lg border bg-muted shadow-sm">
              <div className="aspect-video relative">
                <VideoPlayer
                  key={props.initialVideoId}
                  initialVideoId={props.initialVideoId}
                  currentChapter={props.currentChapter}
                  onVideoEnd={props.onVideoEnd}
                  currentTime={props.currentTime}
                  onTimeUpdate={props.onTimeUpdate}
                  onChapterComplete={props.onChapterComplete}
                  course={props.course}
                  onVideoSelect={props.onVideoSelect}
                  isLastVideo={props.isLastVideo}
                  onWatchAnotherCourse={props.onWatchAnotherCourse}
                />
              </div>
            </div>

            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <QuizSectionTabs
                course={props.course}
                currentChapter={props.currentChapter}
                planId={props.planId ?? ""}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

