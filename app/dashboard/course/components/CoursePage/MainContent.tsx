"use client"

import React, { Suspense, useCallback, useState, useEffect, useRef } from "react"
import dynamic from "next/dynamic"
import { ErrorBoundary } from "react-error-boundary"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shimmer } from "@/components/ui/shimmer"
import { AlertTriangle, Loader2 } from "lucide-react"
import CourseDetailsTabs from "./CourseDetailsTabs"
import CourseActionsWithErrorBoundary from "./CourseActions"
import { useSession } from "next-auth/react"
import type { FullCourseType, FullChapterType } from "@/app/types"
import type { CourseProgress } from "@prisma/client"
import { useToast } from "@/hooks/use-toast"

const VideoPlayerEnhanced = dynamic(() => import("./VideoPlayerEnhanced"), {
  ssr: false,
  loading: () => <VideoPlayerSkeleton />,
})

interface MainContentProps {
  course: FullCourseType
  initialVideoId?: string
  nextVideoId?: string
  prevVideoId?: string
  onVideoEnd?: () => void
  onVideoSelect: (videoId: string) => void
  currentChapter?: FullChapterType
  currentTime: number
  onTimeUpdate: (time: number) => void
  progress?: CourseProgress | null
  onChapterComplete?: (chapterId: number) => void
  planId?: string
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

const VideoPlayerSkeleton = () => <Shimmer className="w-full aspect-video rounded-lg" />

const ChapterInfo = ({ course }: { course: FullCourseType }) => (
  <h1 className="text-2xl md:text-4xl font-bold text-primary flex-grow">{course.name}</h1>
)

interface VideoPlayerProps {
  initialVideoId?: string
  currentChapter?: FullChapterType
  onVideoEnd?: () => void
  currentTime: number
  onTimeUpdate: (time: number) => void
  onChapterComplete?: (chapterId: number) => void
  course: FullCourseType
  onVideoSelect: (videoId: string) => void
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
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLDivElement>(null)
  const [currentVideoId, setCurrentVideoId] = useState(initialVideoId)
  const { toast } = useToast()

  useEffect(() => {
    if (videoRef.current) {
      const player = videoRef.current.querySelector("video")
      if (player) {
        player.currentTime = 0
        player.play()
      }
    }
  }, [currentVideoId])

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
          }
        } else {
          const nextUnitIndex = currentUnitIndex + 1
          if (nextUnitIndex < course.courseUnits.length) {
            const nextUnit = course.courseUnits[nextUnitIndex]
            const firstChapterWithVideo = nextUnit.chapters.find((chapter) => chapter.videoId)
            if (firstChapterWithVideo && firstChapterWithVideo.videoId) {
              setCurrentVideoId(firstChapterWithVideo.videoId)
              onVideoSelect(firstChapterWithVideo.videoId)
            }
          } else {
            toast({
              title: "Course Completed",
              description: "Congratulations! You've completed all videos in this course.",
              variant: "default",
            })
          }
        }
      }
    }

    if (onVideoEnd) {
      onVideoEnd()
    }
  }, [currentVideoId, currentChapter, course, onChapterComplete, onVideoSelect, onVideoEnd, toast])

  return currentVideoId ? (
    <Card className="mb-8 overflow-hidden">
      <CardContent className="p-0">
        <div ref={videoRef} className="relative">
          <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
            <Suspense fallback={<VideoPlayerSkeleton />}>
              <VideoPlayerEnhanced
                videoId={currentVideoId}
                onEnded={handleVideoEnd}
                autoPlay={true}
                initialTime={currentTime}
                onProgress={onTimeUpdate}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      </CardContent>
    </Card>
  ) : null
}

interface QuizSectionTabsProps {
  course: FullCourseType
  currentChapter?: FullChapterType
  planId?: string
}

const QuizSectionTabs = ({ course, currentChapter, planId }: QuizSectionTabsProps) => {
  return (
    <Card className="mt-8">
      <CardContent className="p-0">
        <CourseDetailsTabs
          chapterId={currentChapter?.id ?? 0}
          name={currentChapter?.name || "Chapter Details"}
          course={course}
          chapter={currentChapter as FullChapterType}
          planId={planId}
        />
      </CardContent>
    </Card>
  )
}

function LoadingFallback({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="h-6 w-4 animate-spin text-primary mr-2" />
      <span>{message}</span>
    </div>
  )
}

export default function MainContent(props: MainContentProps) {
  const { data: session } = useSession()
  const isOwner = session?.user?.id === props.course.userId

  return (
    <div className="min-h-full bg-background w-full overflow-y-auto">
      <ChapterInfo course={props.course} />
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 py-4">
          {isOwner && (
            <div className="w-full lg:w-auto flex flex-wrap justify-end gap-2">
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <Suspense fallback={<LoadingFallback message="Loading actions..." />}>
                  <CourseActionsWithErrorBoundary slug={props.course.slug || ""} quizData={undefined} />
                </Suspense>
              </ErrorBoundary>
            </div>
          )}
        </div>
      </header>

      <main className="container py-6 px-4 space-y-6 sm:space-y-8 w-full mt-16 lg:mt-0">
        <div className="aspect-video overflow-hidden rounded-lg bg-muted shadow-sm w-full">
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
          />
        </div>

        <div className="rounded-lg bg-card text-card-foreground shadow-sm w-full">
          <QuizSectionTabs course={props.course} currentChapter={props.currentChapter} planId={props.planId} />
        </div>
      </main>
    </div>
  )
}

