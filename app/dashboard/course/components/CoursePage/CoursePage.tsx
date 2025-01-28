"use client"

import React, { useReducer, useEffect, useMemo, useCallback, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import MainContent from "./MainContent"
import RightSidebar from "./RightSidebar"
import useProgress from "@/hooks/useProgress"
import type { FullChapterType, FullCourseType } from "@/app/types"
import { useUser } from "@/app/providers/userContext"
import throttle from "lodash.throttle"
import PriorityQueue from "@/lib/PriorityQueue"
import { useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Menu, VideotapeIcon, X } from "lucide-react"

interface State {
  selectedVideoId: string | undefined
  currentChapter: FullChapterType | undefined
  nextVideoId: string | undefined
  prevVideoId: string | undefined
}

type Action =
  | { type: "SET_VIDEO"; payload: { videoId: string; chapter: FullChapterType } }
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
const MemoizedRightSidebar = React.memo(RightSidebar)

export default function CoursePage({ course, initialChapterId }: CoursePageProps) {
  const searchParams = useSearchParams()
  const { user, loading: isProfileLoading, error } = useUser()
  const [state, dispatch] = useReducer(reducer, {
    selectedVideoId: undefined,
    currentChapter: undefined,
    nextVideoId: undefined,
    prevVideoId: undefined,
  })
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const { data: session } = useSession()
  const { toast } = useToast()
  const isInitialMount = useRef(true)
  const hasSetInitialVideo = useRef(false)

  const videoQueue = useMemo(() => {
    const queue = new PriorityQueue<{
      videoId: string
      chapterId: number
      unitId: number
      chapter: FullChapterType
    }>()

    course.courseUnits?.forEach((unit, unitIndex) => {
      unit.chapters
        .filter(
          (chapter): chapter is FullChapterType & { videoId: string } =>
            "videoId" in chapter && Boolean(chapter.videoId),
        )
        .forEach((chapter, chapterIndex) => {
          queue.enqueue(
            {
              videoId: chapter.videoId,
              chapterId: chapter.id,
              unitId: unit.id,
              chapter,
            },
            unitIndex * 1000 + chapterIndex,
          )
        })
    })

    return queue
  }, [course.courseUnits])

  const findChapterByVideoId = useCallback(
    (videoId: string): FullChapterType | undefined => {
      let foundChapter: FullChapterType | undefined
      const tempQueue = new PriorityQueue<{
        videoId: string
        chapterId: number
        unitId: number
        chapter: FullChapterType
      }>()

      while (!videoQueue.isEmpty()) {
        const entry = videoQueue.dequeue()!
        if (entry.videoId === videoId) {
          foundChapter = entry.chapter
        }
        tempQueue.enqueue(entry, 0)
      }

      while (!tempQueue.isEmpty()) {
        const entry = tempQueue.dequeue()!
        videoQueue.enqueue(entry, 0)
      }

      return foundChapter
    },
    [videoQueue],
  )

  useEffect(() => {
    if (!videoQueue.isEmpty() && !state.selectedVideoId && !hasSetInitialVideo.current) {
      const chapterId = initialChapterId
      let initialVideo

      if (chapterId) {
        const tempQueue = new PriorityQueue<{
          videoId: string
          chapterId: number
          unitId: number
          chapter: FullChapterType
        }>()
        while (!videoQueue.isEmpty()) {
          const entry = videoQueue.dequeue()!
          if (String(entry.chapterId) === chapterId) {
            initialVideo = entry
            break
          }
          tempQueue.enqueue(entry, 0)
        }
        while (!tempQueue.isEmpty()) {
          videoQueue.enqueue(tempQueue.dequeue()!, 0)
        }
      }

      if (!initialVideo) {
        initialVideo = videoQueue.dequeue()
        videoQueue.enqueue(initialVideo!, 0)
      }

      if (initialVideo) {
        dispatch({
          type: "SET_VIDEO",
          payload: { videoId: initialVideo.videoId, chapter: initialVideo.chapter },
        })
        hasSetInitialVideo.current = true
      }
    }
  }, [videoQueue, state.selectedVideoId, initialChapterId])

  useEffect(() => {
    if (!isInitialMount.current && state.selectedVideoId) {
      const tempQueue = new PriorityQueue<{
        videoId: string
        chapterId: number
        unitId: number
        chapter: FullChapterType
      }>()
      let currentIndex = -1
      let nextVideo, prevVideo

      while (!videoQueue.isEmpty()) {
        const entry = videoQueue.dequeue()!
        if (entry.videoId === state.selectedVideoId) {
          currentIndex = tempQueue.isEmpty() ? -1 : tempQueue.getHeap().length - 1
        }
        tempQueue.enqueue(entry, 0)
      }

      if (currentIndex !== -1) {
        nextVideo = tempQueue.getHeap()[currentIndex + 1]?.item.videoId
        prevVideo = currentIndex > 0 ? tempQueue.getHeap()[currentIndex - 1]?.item.videoId : undefined
      }

      while (!tempQueue.isEmpty()) {
        videoQueue.enqueue(tempQueue.dequeue()!, 0)
      }

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
  }, [state.selectedVideoId, videoQueue])

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
        updateProgress(updateData)
      },
      5000,
    ),
    [updateProgress],
  )

  const markChapterAsCompleted = useCallback(() => {
    if (!state.currentChapter || !progress) return

    const updatedCompletedChapters = Array.isArray(progress.completedChapters) ? [...progress.completedChapters] : []

    if (!updatedCompletedChapters.includes(+state.currentChapter.id)) {
      updatedCompletedChapters.push(+state.currentChapter.id)
      const totalChapters = videoQueue.size()
      const newProgress = Math.round((updatedCompletedChapters.length / totalChapters) * 100)

      throttledUpdateProgress({
        currentChapterId: state.currentChapter?.id ? Number(state.currentChapter.id) : undefined,
        completedChapters: updatedCompletedChapters,
        progress: newProgress,
      })
    }
  }, [state.currentChapter, progress, throttledUpdateProgress, videoQueue.size()])

  const handleVideoEnd = useCallback(() => {
    markChapterAsCompleted()

    if (state.nextVideoId) {
      const nextChapter = findChapterByVideoId(state.nextVideoId)
      if (nextChapter) {
        const nextVideoEntry = videoQueue.find((entry) => entry.videoId === state.nextVideoId)
        if (nextVideoEntry) {
          dispatch({
            type: "SET_VIDEO",
            payload: { videoId: state.nextVideoId, chapter: nextChapter },
          })
          throttledUpdateProgress({
            currentChapterId: Number(nextChapter.id),
            currentUnitId: Number(nextVideoEntry.unitId),
          })
        }
      }
    } else {
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
  }, [
    state.nextVideoId,
    state.currentChapter,
    videoQueue,
    findChapterByVideoId,
    throttledUpdateProgress,
    toast,
    markChapterAsCompleted,
  ])

  const handleVideoSelect = useCallback(
    (videoId: string) => {
      if (state.currentChapter) {
        markChapterAsCompleted()
      }

      const selectedChapter = findChapterByVideoId(videoId)
      if (selectedChapter) {
        const selectedVideoEntry = videoQueue.find((entry) => entry.videoId === videoId)
        if (selectedVideoEntry) {
          dispatch({
            type: "SET_VIDEO",
            payload: { videoId, chapter: selectedChapter },
          })
          throttledUpdateProgress({
            currentChapterId: Number(selectedChapter.id),
            currentUnitId: Number(selectedVideoEntry.unitId),
            lastAccessedAt: new Date(),
          })
        }
      }
    },
    [state.currentChapter, findChapterByVideoId, throttledUpdateProgress, videoQueue, markChapterAsCompleted, dispatch],
  )

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

  const isSubscribed = session?.user?.userType !== "Free"

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-16 w-16 border-t-4 border-b-4 border-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <nav className="sticky top-0 z-50 w-full bg-background border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-lg font-semibold md:hidden">{course.name}</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden"
              aria-label="Open sidebar"
            >
              <VideotapeIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-grow overflow-hidden lg:w-3/4 relative">
          <MemoizedMainContent
            course={course}
            initialVideoId={state.selectedVideoId}
            nextVideoId={state.nextVideoId}
            prevVideoId={state.prevVideoId}
            onVideoEnd={handleVideoEnd}
            onVideoSelect={handleVideoSelect}
            currentChapter={state.currentChapter}
            currentTime={0}
            onTimeUpdate={(time: number) => {
              if (state.currentChapter && session) {
                throttledUpdateProgress({
                  currentChapterId: Number(state.currentChapter.id),
                })
              }
            }}
            progress={progress}
            onChapterComplete={markChapterAsCompleted}
            planId={user?.planId}
          />
        </div>

        <AnimatePresence>
          {(isSidebarOpen || !isSmallScreen) && (
            <motion.div
              className={`
                w-full lg:w-1/4 bg-background
                overflow-hidden flex flex-col
                fixed inset-y-0 right-0 z-50
                lg:relative lg:translate-x-0
              `}
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
                <X className="h-5 w-5" />
              </Button>
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
                courseOwnerId={course.userId}
                isSubscribed={isSubscribed}
                progress={progress || null}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

