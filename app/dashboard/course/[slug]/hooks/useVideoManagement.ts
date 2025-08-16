"use client"

import { useState, useCallback, useMemo } from 'react'
import { useAppDispatch } from '@/store/hooks'
import { setCurrentVideoApi, markChapterAsCompleted } from '@/store/slices/course-slice'
import { useToast } from '@/components/ui/use-toast'
import { useVideoState } from '../components/video/hooks/useVideoState'
import type { FullCourseType, FullChapterType } from '@/app/types/types'

interface VideoPlaylistItem {
  chapter: FullChapterType
  videoId: string
  title: string
  description?: string
  isFree: boolean
  duration: number
}

export function useVideoManagement(course: FullCourseType, videoDurations: Record<string, number> = {}) {
  const dispatch = useAppDispatch()
  const { toast } = useToast()

  // Video playlist with proper typing - handle both course.chapters and course.courseUnits[].chapters
  const videoPlaylist = useMemo(() => {
    if (!course) return []
    
    // Get chapters from either direct chapters property or from course units
    let chapters: FullChapterType[] = []
    
    if (course.chapters && Array.isArray(course.chapters)) {
      // Direct chapters property (flattened course)
      chapters = course.chapters
    } else if (course.courseUnits && Array.isArray(course.courseUnits)) {
      // Extract chapters from course units
      chapters = course.courseUnits
        .flatMap(unit => unit.chapters || [])
        .filter((chapter): chapter is FullChapterType => Boolean(chapter))
    }
    
    if (chapters.length === 0) return []
    
    return chapters
      .filter((chapter): chapter is FullChapterType => 
        Boolean(chapter?.videoId && chapter?.id)
      )
      .map((chapter) => ({
        chapter,
        videoId: chapter.videoId!,
        title: chapter.title,
        description: chapter.description,
        isFree: chapter.isFree || false,
        duration: videoDurations[chapter.videoId!] || 0,
      }))
      .sort((a, b) => (a.chapter.order || 0) - (b.chapter.order || 0))
  }, [course, videoDurations])

  // Chapter selection handler
  const handleChapterSelect = useCallback(async (chapter: FullChapterType) => {
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

      // Update Redux state
      dispatch(setCurrentVideoApi(chapter.videoId))

      // Update Zustand store
      useVideoState.getState().setCurrentVideo(chapter.videoId, course.id)

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
  }, [course.id, dispatch, toast])

  // Chapter completion handler
  const handleChapterComplete = useCallback(async (chapterId: string, userId?: string) => {
    if (!chapterId || !userId) return
    
    try {
      await dispatch(markChapterAsCompleted({
        chapterId: chapterId.toString(),
        courseId: course.id.toString(),
      }))
      
      toast({
        title: "Chapter Completed!",
        description: "Great job! You've completed this chapter.",
      })
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

    const currentIndex = videoPlaylist.findIndex(item => item.videoId === currentVideoId)
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