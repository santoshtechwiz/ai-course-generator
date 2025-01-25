"use client"

import React, { useReducer, useEffect, useMemo, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import MainContent from "./MainContent"
import RightSidebar from "./RightSidebar"
import useProgress from "@/hooks/useProgress"
import type { FullChapterType, FullCourseType } from "@/app/types"

import { useUser } from "@/app/providers/userContext"

import throttle from "lodash.throttle"
import PriorityQueue from "@/lib/PriorityQueue"

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
}

const MemoizedMainContent = React.memo(MainContent)
const MemoizedRightSidebar = React.memo(RightSidebar)

export default function CoursePage({ course }: CoursePageProps) {
  const { user, loading: isProfileLoading, error } = useUser()
  const [state, dispatch] = useReducer(reducer, {
    selectedVideoId: undefined,
    currentChapter: undefined,
    nextVideoId: undefined,
    prevVideoId: undefined,
  })

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
        tempQueue.enqueue(entry, 0) // Priority doesn't matter for temporary storage
      }

      // Restore the original queue
      while (!tempQueue.isEmpty()) {
        const entry = tempQueue.dequeue()!
        videoQueue.enqueue(entry, 0) // Use the original priority if needed
      }

      return foundChapter
    },
    [videoQueue],
  )

  useEffect(() => {
    if (!videoQueue.isEmpty() && !state.selectedVideoId && !hasSetInitialVideo.current) {
      const chapterId = searchParams.get("chapter")
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
        // Restore the queue
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
  }, [videoQueue, state.selectedVideoId, searchParams])

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

      // Restore the original queue
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
    throttle((updateData: any) => {
      updateProgress(updateData)
    }, 5000), // Throttle to once every 5 seconds
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
        const tempQueue = new PriorityQueue<{
          videoId: string
          chapterId: number
          unitId: number
          chapter: FullChapterType
        }>()
        let selectedVideoEntry

        while (!videoQueue.isEmpty()) {
          const entry = videoQueue.dequeue()!
          if (entry.videoId === videoId) {
            selectedVideoEntry = entry
          }
          tempQueue.enqueue(entry, 0)
        }

        // Restore the original queue
        while (!tempQueue.isEmpty()) {
          videoQueue.enqueue(tempQueue.dequeue()!, 0)
        }

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
    [state.currentChapter, findChapterByVideoId, throttledUpdateProgress, videoQueue, markChapterAsCompleted],
  )

  useEffect(() => {
    return () => {
      dispatch({ type: "RESET" })
    }
  }, [])

  const isSubscribed = session?.user?.userType !== "Free"

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-[calc(100vh-4rem)] bg-background">
      <div className="flex-grow lg:w-3/4 p-4">
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
            if (state.currentChapter) {
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
      <div className="w-full lg:w-1/4 lg:min-w-[350px] p-4 mt-4 lg:mt-0">
        <MemoizedRightSidebar
          course={course}
          currentChapter={state.currentChapter}
          courseId={course.id.toString()}
          onVideoSelect={handleVideoSelect}
          currentVideoId={state.selectedVideoId || ""}
          isAuthenticated={!!session}
          courseOwnerId={course.userId}
          isSubscribed={isSubscribed}
      
          progress={progress || null}
        />
      </div>
    </div>
  )
}

