"use client"

import React, { useReducer, useEffect, useMemo, useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import MainContent from "./MainContent"
import VideoNavigationSidebar from "./VideoNavigationSidebar"
import useProgress from "@/hooks/useProgress"
import type { FullChapter, FullCourseType, FullChapterType } from "@/app/types/types"
import { useUser } from "@/app/providers/userContext"
import throttle from "lodash.throttle"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatePresence, motion } from "framer-motion"
import MobilePlayList from "./MobilePlayList"

// State and Action Types
interface State {
  selectedVideoId: string | undefined
  currentChapter: FullChapterType | undefined
  nextVideoId: string | undefined
  prevVideoId: string | undefined
}

type Action =
  | { type: "SET_VIDEO"; payload: { videoId: string; chapter: FullChapter } }
  | { type: "SET_NAVIGATION"; payload: { next?: string; prev?: string } }
  | { type: "RESET" }

// Reducer Function
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_VIDEO":
      return {
        ...state,
        selectedVideoId: action.payload.videoId,
        currentChapter: action.payload.chapter,
      }
    case "SET_NAVIGATION":
      return {
        ...state,
        nextVideoId: action.payload.next,
        prevVideoId: action.payload.prev,
      }
    case "RESET":
      return {
        selectedVideoId: undefined,
        currentChapter: undefined,
        nextVideoId: undefined,
        prevVideoId: undefined,
      }
    default:
      return state
  }
}

// Props Interface
interface CoursePageProps {
  course: FullCourseType
  initialChapterId?: string
}

// Memoized Components
const MemoizedMainContent = React.memo(MainContent)
const MemoizedVideoNavigationSidebar = React.memo(VideoNavigationSidebar)

// Custom Hook for Video Playlist
function useVideoPlaylist(course: FullCourseType) {
  return useMemo(() => {
    const playlist: { videoId: string; chapter: FullChapter }[] = []
    course.courseUnits?.forEach((unit) => {
      unit.chapters
        .filter(
          (chapter): chapter is FullChapter & { videoId: string; summary: string | null } =>
            "videoId" in chapter && Boolean(chapter.videoId),
        )
        .forEach((chapter) => {
          playlist.push({ videoId: chapter.videoId, chapter })
        })
    })
    return playlist
  }, [course.courseUnits])
}

export default function CoursePage({ course, initialChapterId }: CoursePageProps) {
  const { user, loading: isProfileLoading, error } = useUser()
  const [state, dispatch] = useReducer(reducer, {
    selectedVideoId: undefined,
    currentChapter: undefined,
    nextVideoId: undefined,
    prevVideoId: undefined,
  })
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const [isLastVideo, setIsLastVideo] = useState(false)
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const isInitialMount = useRef(true)
  const hasSetInitialVideo = useRef(false)

  const videoPlaylist = useVideoPlaylist(course)

  const findChapterByVideoId = useCallback(
    (videoId: string): FullChapterType | undefined => {
      return videoPlaylist.find((entry) => entry.videoId === videoId)?.chapter
    },
    [videoPlaylist],
  )

  // Set Initial Video
  useEffect(() => {
    if (!state.selectedVideoId && !hasSetInitialVideo.current) {
      const initialVideo = initialChapterId
        ? videoPlaylist.find((entry) => entry.chapter.id.toString() === initialChapterId)
        : videoPlaylist[0]

      if (initialVideo) {
        dispatch({
          type: "SET_VIDEO",
          payload: { videoId: initialVideo.videoId, chapter: initialVideo.chapter },
        })
        hasSetInitialVideo.current = true
      }
    }
  }, [videoPlaylist, state.selectedVideoId, initialChapterId])

  // Update Navigation (Next/Prev Video)
  useEffect(() => {
    if (!isInitialMount.current && state.selectedVideoId) {
      const currentIndex = videoPlaylist.findIndex((entry) => entry.videoId === state.selectedVideoId)
      const nextVideo = currentIndex < videoPlaylist.length - 1 ? videoPlaylist[currentIndex + 1]?.videoId : undefined
      const prevVideo = currentIndex > 0 ? videoPlaylist[currentIndex - 1]?.videoId : undefined

      dispatch({
        type: "SET_NAVIGATION",
        payload: {
          next: nextVideo,
          prev: prevVideo,
        },
      })
    } else {
      isInitialMount.current = false
    }
  }, [state.selectedVideoId, videoPlaylist])

  const { progress, isLoading, updateProgress } = useProgress({
    courseId: +course.id,
    initialProgress: undefined,
    currentChapterId: state.currentChapter?.id?.toString(),
  })

  const throttledUpdateProgress = useCallback(
    throttle(
      (updateData: {
        currentChapterId?: number
        completedChapters?: number[]
        progress?: number
        currentUnitId?: number
        isCompleted?: boolean
        lastAccessedAt?: Date
      }) => {
        if (session) {
          updateProgress(updateData)
        }
      },
      5000,
    ),
    [updateProgress, session],
  )

  const markChapterAsCompleted = useCallback(() => {
    if (!state.currentChapter || !progress) return

    const updatedCompletedChapters = Array.isArray(progress.completedChapters) ? [...progress.completedChapters] : []

    if (!updatedCompletedChapters.includes(+state.currentChapter.id)) {
      updatedCompletedChapters.push(+state.currentChapter.id)
      const totalChapters = videoPlaylist.length
      const newProgress = Math.round((updatedCompletedChapters.length / totalChapters) * 100)

      throttledUpdateProgress({
        currentChapterId: state.currentChapter?.id ? Number(state.currentChapter.id) : undefined,
        completedChapters: updatedCompletedChapters,
        progress: newProgress,
      })
    }
  }, [state.currentChapter, progress, throttledUpdateProgress, videoPlaylist.length])

  const handleVideoEnd = useCallback(() => {
    markChapterAsCompleted()

    if (state.nextVideoId) {
      const nextChapter = findChapterByVideoId(state.nextVideoId)
      if (nextChapter) {
        dispatch({
          type: "SET_VIDEO",
          payload: { videoId: state.nextVideoId, chapter: nextChapter },
        })
        throttledUpdateProgress({
          currentChapterId: Number(nextChapter.id),
        })
      }
    } else {
      const allChaptersCompleted = videoPlaylist.length === progress?.completedChapters.length
      if (allChaptersCompleted) {
        setIsLastVideo(true)
        throttledUpdateProgress({
          currentChapterId: state.currentChapter?.id ? Number(state.currentChapter.id) : undefined,
          isCompleted: true,
          progress: 100,
        })

        toast({
          title: "Course Completed",
          description: "Congratulations! You've completed all videos in this course.",
          variant: "default",
        })
      }
    }
  }, [
    state.nextVideoId,
    state.currentChapter,
    videoPlaylist,
    findChapterByVideoId,
    throttledUpdateProgress,
    toast,
    markChapterAsCompleted,
    progress?.completedChapters.length,
  ])

  const handleVideoSelect = useCallback(
    (videoId: string) => {
      if (state.currentChapter) {
        markChapterAsCompleted()
      }

      const selectedChapter = findChapterByVideoId(videoId)
      if (selectedChapter) {
        dispatch({
          type: "SET_VIDEO",
          payload: { videoId, chapter: selectedChapter },
        })
        throttledUpdateProgress({
          currentChapterId: Number(selectedChapter.id),
          lastAccessedAt: new Date(),
        })
      }
    },
    [findChapterByVideoId, throttledUpdateProgress, markChapterAsCompleted, state.currentChapter],
  )

  const handleWatchAnotherCourse = useCallback(() => {
    router.push("/dashboard")
  }, [router])

  // Responsive Sidebar Handling
  useEffect(() => {
    const handleResize = () => {
      const smallScreen = window.innerWidth < 1024
      setIsSmallScreen(smallScreen)
      setIsSidebarOpen(!smallScreen)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Cleanup on Unmount
  useEffect(() => {
    return () => {
      dispatch({ type: "RESET" })
    }
  }, [])

  if (isLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="lg:hidden">
          <Skeleton className="h-14 w-full" />
        </div>
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1">
            <Skeleton className="aspect-video w-full" />
            <div className="p-4 lg:p-6">
              <Skeleton className="h-8 w-[200px] mb-4" />
              <Skeleton className="h-4 w-full max-w-[600px]" />
            </div>
          </div>
          <div className="hidden lg:block w-[400px] border-l">
            <Skeleton className="h-full" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden">
        <MobilePlayList courseName={course.name} onSidebarOpen={() => setIsSidebarOpen(true)} />
      </div>

      <div className="flex flex-col lg:flex-row">
        <main className="flex-1 min-w-0">
          <div className="relative">
            <div className="aspect-video w-full bg-black">
              <MemoizedMainContent
                course={course}
                initialVideoId={state.selectedVideoId}
                nextVideoId={state.nextVideoId}
                prevVideoId={state.prevVideoId}
                onVideoEnd={handleVideoEnd}
                onVideoSelect={handleVideoSelect}
                currentChapter={state.currentChapter}
                currentTime={0}
                onWatchAnotherCourse={handleWatchAnotherCourse}
                onTimeUpdate={(time: number) => {
                  if (state.currentChapter && session) {
                    throttledUpdateProgress({
                      currentChapterId: Number(state.currentChapter.id),
                    })
                  }
                }}
                progress={progress || undefined}
                onChapterComplete={markChapterAsCompleted}
                planId={user?.planId}
                isLastVideo={isLastVideo}
              />
            </div>
          </div>
        </main>

        <AnimatePresence mode="wait">
          {(isSidebarOpen || !isSmallScreen) && (
            <motion.aside
              className={cn(
                "fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-background lg:relative",
                "lg:w-[400px] lg:border-l",
                "max-w-sm lg:max-w-none",
                isSmallScreen && "shadow-lg",
              )}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 150 }}
            >
              {isSmallScreen && (
                <div className="border-b p-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(false)}
                    className="ml-auto"
                    aria-label="Close sidebar"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex-1 overflow-hidden">
                <MemoizedVideoNavigationSidebar
                  course={course}
                  currentChapter={state.currentChapter}
                  courseId={course.id.toString()}
                  onVideoSelect={(videoId) => {
                    handleVideoSelect(videoId)
                    if (isSmallScreen) setIsSidebarOpen(false)
                  }}
                  currentVideoId={state.selectedVideoId || ""}
                  isAuthenticated={!!session}
                  progress={progress || null}
                  nextVideoId={state.nextVideoId}
                  prevVideoId={state.prevVideoId}
                  completedChapters={progress?.completedChapters || []}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}