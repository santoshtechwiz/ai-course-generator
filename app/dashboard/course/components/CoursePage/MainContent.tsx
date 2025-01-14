'use client'

import React, { Suspense, useCallback } from "react"
import dynamic from "next/dynamic"
import { ErrorBoundary } from "react-error-boundary"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shimmer } from "@/components/ui/shimmer"
import { AlertTriangle, Loader2 } from 'lucide-react'
import CourseDetailsTabs from "./CourseDetailsTabs"
import CourseActionsWithErrorBoundary from "./CourseActions"
import { useSession } from "next-auth/react"
import { CourseProgress, FullChapterType, FullCourseType } from "@app/types"

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

const VideoPlayerSkeleton = () => (
  <Shimmer className="w-full aspect-video rounded-lg" />
)

const ChapterInfo = ({ course }: { course: FullCourseType }) => (
  <h1 className="text-2xl md:text-4xl font-bold text-primary">
    {course.name}
  </h1>
)

interface VideoPlayerProps {
  initialVideoId?: string
  currentChapter?: FullChapterType
  onVideoEnd?: () => void
  currentTime: number
  onTimeUpdate: (time: number) => void
  onChapterComplete?: (chapterId: number) => void
}

const VideoPlayer = ({
  initialVideoId,
  currentChapter,
  onVideoEnd,
  currentTime,
  onTimeUpdate,
  onChapterComplete,
}: VideoPlayerProps) => {
  const videoRef = React.useRef<HTMLDivElement>(null)

  const handleVideoEnd = useCallback(() => {
    if (currentChapter?.id && onChapterComplete) {
      onChapterComplete(currentChapter.id)
    }
    onVideoEnd?.()
  }, [currentChapter?.id, onChapterComplete, onVideoEnd])

  return initialVideoId ? (
    <Card className="mb-8 overflow-hidden">
      <CardContent className="p-0">
        <div ref={videoRef} className="relative">
          <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => {}}>
            <Suspense fallback={<VideoPlayerSkeleton />}>
              <VideoPlayerEnhanced
                videoId={initialVideoId}
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
}

const QuizSectionTabs = ({ course, currentChapter }: QuizSectionTabsProps) => {
  return (
    <Card className="mt-8">
      <CardContent className="p-0">
        <CourseDetailsTabs
          chapterId={currentChapter?.id ?? 0}
          name={currentChapter?.name || "Chapter Details"}
          course={course}
          chapter={currentChapter}
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
    <div className="min-h-screen bg-background w-full">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:h-16 gap-4">
          <ChapterInfo course={props.course} />
          {isOwner && (
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <Suspense fallback={<LoadingFallback message="Loading actions..." />}>
                  <CourseActionsWithErrorBoundary slug={props.course.slug || ""} />
                </Suspense>
              </ErrorBoundary>
            </div>
          )}
        </div>
      </header>

      <main className="container py-6 px-4 space-y-6 sm:space-y-8 w-full">
        <div className="aspect-video overflow-hidden rounded-lg bg-muted shadow-sm w-full">
          <VideoPlayer
            initialVideoId={props.initialVideoId}
            currentChapter={props.currentChapter}
            onVideoEnd={props.onVideoEnd}
            currentTime={props.currentTime}
            onTimeUpdate={props.onTimeUpdate}
            onChapterComplete={props.onChapterComplete}
          />
        </div>

        <div className="rounded-lg bg-card text-card-foreground shadow-sm w-full">
          <QuizSectionTabs course={props.course} currentChapter={props.currentChapter} />
        </div>
      </main>
    </div>
  )
}

