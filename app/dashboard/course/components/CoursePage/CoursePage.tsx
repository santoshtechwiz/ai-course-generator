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
import { VideotapeIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatePresence, motion } from "framer-motion"

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

interface CoursePageProps {
  course: FullCourseType
  initialChapterId?: string
}

const MemoizedMainContent = React.memo(MainContent)
const MemoizedRightSidebar = React.memo(VideoNavigationSidebar)

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

  const videoPlaylist = useMemo(() => {
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

  const findChapterByVideoId = useCallback(
    (videoId: string): FullChapterType | undefined => {
      return videoPlaylist.find((entry) => entry.videoId === videoId)?.chapter
    },
    [videoPlaylist],
  )

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
    [updateProgress, session], // Updated dependency array
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
    [findChapterByVideoId, throttledUpdateProgress, markChapterAsCompleted, state.currentChapter], // Updated dependency array
  )

  const handleWatchAnotherCourse = useCallback(() => {
    router.push("/dashboard")
  }, [router])

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

  useEffect(() => {
    return () => {
      dispatch({ type: "RESET" })
    }
  }, [])

  const isSubscribed = session?.user?.userType !== "Free" || course.isPublic === true

  if (isLoading || isProfileLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Skeleton className="h-16 w-full sticky top-0 z-50" />
        <div className="flex flex-1 overflow-hidden">
          <Skeleton className="flex-grow lg:w-3/4" />
          <Skeleton className="w-1/4 hidden lg:block" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <nav className="sticky top-0 z-50 w-full bg-background border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex w-full h-16 max-w-screen-2xl items-center px-4">
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-xl font-semibold md:text-2xl lg:hidden">{course.name}</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden"
              aria-label="Open sidebar"
            >
              <VideotapeIcon className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-grow overflow-hidden lg:w-3/4 relative p-4 lg:p-6">
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

        <AnimatePresence>
          {(isSidebarOpen || !isSmallScreen) && (
            <motion.div
              className={cn(
                "w-full lg:w-1/4 bg-background overflow-hidden flex flex-col fixed inset-y-0 right-0 z-50 lg:relative lg:translate-x-0",
                isSmallScreen && "shadow-lg",
              )}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 lg:hidden"
                aria-label="Close sidebar"
              >
                <X className="h-6 w-6" />
              </Button>
              <div className="p-4 lg:p-6 overflow-y-auto flex-grow">
                <MemoizedRightSidebar
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

