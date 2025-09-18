"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useAppDispatch } from '@/store/hooks'
import { setCurrentVideoApi, markChapterAsCompleted, setLoading } from '@/store/slices/course-slice'
import { useToast } from '@/components/ui/use-toast'
import { useVideoState } from '../components/video/hooks/useVideoState'
import { progressService } from '@/services/progressService'
import type { Course } from '@/app/types/user-types'

// Extended interface to match actual usage in the video components
interface ExtendedChapterType {
  id: string
  title: string
  videoId?: string
  description?: string
  isFree?: boolean
  content?: string
  order?: number
  duration?: number
}

// Extended course type for video management
interface ExtendedCourseType extends Course {
  chapters?: ExtendedChapterType[]
}

interface VideoPlaylistItem {
  chapter: ExtendedChapterType
  videoId: string
  title: string
  description?: string
  isFree: boolean
  duration: number
}

export function useVideoManagement(course: ExtendedCourseType, videoDurations: Record<string, number> = {}) {
  const dispatch = useAppDispatch()
  const { toast } = useToast()
  // Use a stable reference to the video state store
  const videoStateStore = useRef(useVideoState)
  
  // Fix loading state when component mounts
  useEffect(() => {
    // Set loading to false when videos are available
    const chaptersLength = course?.chapters?.length ?? 0;
    if (chaptersLength > 0) {
      console.log("Setting loading state to false - videos are available");
      dispatch(setLoading(false))
    }
  }, [course?.chapters, dispatch])

  // Video playlist with proper typing - don't depend on videoDurations initially
  const videoPlaylist = useMemo(() => {
    if (!course?.chapters) return []
    
    return course.chapters
      .filter((chapter: ExtendedChapterType | undefined): chapter is ExtendedChapterType => 
        Boolean(chapter?.videoId && chapter?.id)
      )
      .map((chapter: ExtendedChapterType) => ({
        chapter,
        videoId: chapter.videoId!,
        title: chapter.title,
        description: chapter.description,
        isFree: chapter.isFree || false,
        duration: videoDurations[chapter.videoId!] || 0,
      }))
      .sort((a: VideoPlaylistItem, b: VideoPlaylistItem) => 
        (a.chapter.order || 0) - (b.chapter.order || 0)
      )
  }, [course?.chapters, videoDurations])

  // Chapter selection handler
  const handleChapterSelect = useCallback(async (chapter: ExtendedChapterType) => {
    if (!chapter?.id) {
      toast({
        title: "Invalid Chapter",
        description: "Please select a valid chapter.",
        variant: "destructive",
      })
      return
    }

    try {
      // Validate chapter has video
      if (!chapter.videoId) {
        toast({
          title: "Video Unavailable",
          description: "This chapter doesn't have a video available.",
          variant: "destructive",
        })
        return
      }
      
      // Set loading false when selecting a chapter
      dispatch(setLoading(false))

      // Update Redux state
      dispatch(setCurrentVideoApi(chapter.videoId))

      // Update Zustand store with proper error handling
      try {
        const courseIdStr = String(course.id);
        const videoState = videoStateStore.current.getState();
        
        // First update the current video
        videoState.setCurrentVideo(chapter.videoId, courseIdStr);
        
        // Then make sure we've loaded any completed chapters into localStorage
        const completedChapters = videoState.courseProgress[courseIdStr]?.completedChapters || [];
        if (completedChapters.length > 0) {
          // Persist any existing completed chapters
          videoState.syncWithApiData(courseIdStr, completedChapters);
        }
      } catch (err) {
        console.error("Failed to update video state store:", err)
      }

      // Show success feedback
      toast({
        title: "Chapter Selected",
        description: `Now playing: ${chapter.title}`,
      })
    } catch (error) {
      console.error("Error selecting chapter:", error)
      toast({
        title: "Error",
        description: "Failed to select chapter. Please try again.",
        variant: "destructive",
      })
    }
  }, [course.id, dispatch, toast, videoStateStore])

  // Chapter completion handler
  const handleChapterComplete = useCallback(async (chapterId: string, userId?: string) => {
    if (!chapterId || !userId) return

    try {
      // Use the unified progress service
      const completionSuccess = await progressService.markChapterCompleted({
        userId,
        courseId: Number(course.id),
        chapterId: Number(chapterId),
        currentProgress: 100, // Assume 100% when manually completed
        timeSpent: 0, // Time spent not available in this context
        trigger: 'next_click',
        dispatch,
        dispatchChapterCompleted: () => {}, // Not needed since progress service handles this
        isAlreadyCompleted: false
      })

      if (completionSuccess) {
        toast({
          title: "Chapter Completed!",
          description: "Great job! You've completed this chapter.",
        })
      }
    } catch (error) {
      console.error("Error marking chapter as completed:", error)
      toast({
        title: "Error",
        description: "Failed to mark chapter as completed. Please try again.",
        variant: "destructive",
      })
    }
  }, [course.id, dispatch, toast])

  // Navigation helpers
  const getCurrentChapterInfo = useCallback((currentVideoId: string | null) => {
    if (!currentVideoId || !videoPlaylist.length) {
      return {
        currentChapter: null,
        currentIndex: -1,
        nextChapter: null,
        prevChapter: null,
        isLastVideo: false
      }
    }

    const currentIndex = videoPlaylist.findIndex((item: VideoPlaylistItem) => item.videoId === currentVideoId)
    const currentChapter = currentIndex >= 0 ? videoPlaylist[currentIndex]?.chapter : null
    const nextChapter = currentIndex >= 0 && currentIndex < videoPlaylist.length - 1 
      ? videoPlaylist[currentIndex + 1] 
      : null
    const prevChapter = currentIndex > 0 ? videoPlaylist[currentIndex - 1] : null
    const isLastVideo = currentIndex === videoPlaylist.length - 1

    return {
      currentChapter,
      currentIndex,
      nextChapter,
      prevChapter,
      isLastVideo
    }
  }, [videoPlaylist])

  return {
    videoPlaylist,
    handleChapterSelect,
    handleChapterComplete,
    getCurrentChapterInfo
  }
}