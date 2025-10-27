"use client"

import React from "react"
import { useState, useCallback, useMemo, useRef } from "react"
import { useToast } from "@/hooks"
import { api } from "@/lib/api-helper"
import { useRouter } from "next/navigation"
import type { Course, CourseUnit, Chapter } from "@prisma/client"
import type { ChapterCardHandler } from "../components/EnhancedChapterCard"
import { useVideoProcessing } from "./useVideoProcessing"

type CourseWithUnits = Course & {
  units: (CourseUnit & {
    chapters: Chapter[]
  })[]
}

type ChapterStatus = "idle" | "processing" | "success" | "error"

interface ChapterGenerationStatus {
  status: ChapterStatus
  message?: string
}

/**
 * Enhanced version of useCourseEditor with improved video processing
 * CRITICAL: Uses useCallback to prevent infinite loops from function dependencies
 */
export function useEnhancedCourseEditor(initialCourse: CourseWithUnits) {
  const router = useRouter()
  const { toast } = useToast()
  const [course, setCourse] = useState<CourseWithUnits>(initialCourse)
  const [completedChapters, setCompletedChapters] = useState<Set<string>>(new Set())
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
  const [editingChapterTitle, setEditingChapterTitle] = useState("")
  const [showVideoDialog, setShowVideoDialog] = useState(false)
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null)
  const [currentVideoTitle, setCurrentVideoTitle] = useState("")
  const [newChapter, setNewChapter] = useState({ title: "", youtubeId: "" })
  const [addingToUnitId, setAddingToUnitId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [generationStatuses, setGenerationStatuses] = useState<Record<string, ChapterGenerationStatus>>({})

  // Refs for chapter components
  const chapterRefs = useRef<Record<string, React.RefObject<ChapterCardHandler>>>({})
  
  // Memoized callbacks for video processing to prevent infinite loops
  const handleVideoComplete = useCallback((status: any) => {
    console.log(`Video completed for chapter ${status.chapterId}:`, status)
    
    // Update completed chapters
    setCompletedChapters(prev => {
      const newSet = new Set(prev)
      newSet.add(String(status.chapterId))
      return newSet
    })

    // Update course state with new video ID
    if (status.videoId) {
      setCourse((prevCourse) => {
        const newCourse = JSON.parse(JSON.stringify(prevCourse))
        for (const unit of newCourse.units) {
          const chapterIndex = unit.chapters.findIndex((ch: Chapter) => String(ch.id) === String(status.chapterId))
          if (chapterIndex !== -1) {
            unit.chapters[chapterIndex].videoId = status.videoId
            unit.chapters[chapterIndex].videoStatus = "completed"
            break
          }
        }
        return newCourse
      })
    }
  }, [])

  const handleVideoError = useCallback((status: any) => {
    console.error(`Video failed for chapter ${status.chapterId}:`, status)
  }, [])

  // Use our enhanced video processing with memoized callbacks
  const { processVideo, processMultipleVideos, cancelProcessing, isProcessing, statuses, queueStatus } =
    useVideoProcessing({
      useEnhancedService: false,
      onComplete: handleVideoComplete,
      onError: handleVideoError,
    })

  // Computed values with useMemo to prevent recalculation
  const totalChaptersCount = useMemo(() => {
    return course.units.reduce((acc, unit) => acc + unit.chapters.length, 0)
  }, [course.units])

  const processingChaptersCount = useMemo(() => {
    const count = Object.values(isProcessing).filter(Boolean).length
    console.log(`📊 Processing chapters count: ${count}`)
    return count
  }, [isProcessing])

  const progress = useMemo(() => {
    return (completedChapters.size / Math.max(1, totalChaptersCount)) * 100
  }, [completedChapters.size, totalChaptersCount])

  const allChaptersCompleted = useMemo(() => {
    return completedChapters.size === totalChaptersCount && totalChaptersCount > 0
  }, [completedChapters.size, totalChaptersCount])

  const isGeneratingVideos = useMemo(() => {
    return processingChaptersCount > 0
  }, [processingChaptersCount])

  // Utility function with useCallback to prevent recreation
  const extractYoutubeIdFromUrl = useCallback((url: string): string | null => {
    try {
      if (url.includes("youtube.com/watch")) {
        const urlObj = new URL(url)
        return urlObj.searchParams.get("v")
      }

      if (url.includes("youtu.be/")) {
        const urlObj = new URL(url)
        return urlObj.pathname.substring(1)
      }

      if (url.includes("youtube.com/embed/")) {
        const urlObj = new URL(url)
        return urlObj.pathname.split("/").pop() || null
      }

      if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url
      }

      return null
    } catch (e) {
      return null
    }
  }, [])

  // Handler functions with useCallback to prevent infinite loops
  const handleChapterComplete = useCallback((chapterId: string) => {
    setCompletedChapters((prev) => {
      const newSet = new Set(prev)
      newSet.add(chapterId)
      return newSet
    })
  }, [])

  const handleGenerateAll = useCallback(
    async (retryFailed = false) => {
      console.log("🔍 handleGenerateAll called", { retryFailed })

      const allChapters = course.units.flatMap((unit) => unit.chapters)
      console.log(`📊 Total chapters found: ${allChapters.length}`)

      let chaptersToProcess = allChapters.filter((chapter) => !chapter.videoId)

      if (retryFailed) {
        chaptersToProcess = allChapters.filter((chapter) => statuses[chapter.id]?.status === "error")
      }

      if (chaptersToProcess.length === 0) {
        console.log("⚠️ No chapters to process!")
        
        // Mark all chapters as completed
        setCompletedChapters(prev => {
          const newSet = new Set(prev)
          allChapters.forEach((chapter) => {
            newSet.add(String(chapter.id))
          })
          return newSet
        })
        
        return true
      }

      const chapterIds = chaptersToProcess.map((chapter) => chapter.id)
      const result = await processMultipleVideos(chapterIds, { retryFailed })

      return result.success
    },
    [course.units, statuses, processMultipleVideos],
  )

  const generateVideoForChapter = useCallback(
    async (chapter: Chapter): Promise<boolean> => {
      try {
        await processVideo(chapter.id)
        return true
      } catch (error) {
        console.error(`Error generating video for chapter ${chapter.id}:`, error)
        return false
      }
    },
    [processVideo],
  )

  const startEditingChapter = useCallback((chapter: Chapter) => {
    setEditingChapterId(String(chapter.id))
    setEditingChapterTitle(chapter.title)
  }, [])

  const saveChapterTitle = useCallback(() => {
    if (!editingChapterId) return

    setCourse(prevCourse => {
      const newCourse = JSON.parse(JSON.stringify(prevCourse))

      for (const unit of newCourse.units) {
        const chapterIndex = unit.chapters.findIndex((ch: Chapter) => String(ch.id) === editingChapterId)
        if (chapterIndex !== -1) {
          newCourse.units.find((u: CourseUnit) => u.id === unit.id).chapters[chapterIndex].title = editingChapterTitle
          newCourse.units.find((u: CourseUnit) => u.id === unit.id).chapters[chapterIndex].youtubeSearchQuery = editingChapterTitle
          break
        }
      }

      return newCourse
    })
    
    setEditingChapterId(null)
  }, [editingChapterId, editingChapterTitle])

  const cancelEditingChapter = useCallback(() => {
    setEditingChapterId(null)
  }, [])

  const showVideo = useCallback(
    (chapter: Chapter) => {
      if (chapter.videoId) {
        setCurrentVideoId(chapter.videoId)
        setCurrentVideoTitle(chapter.title)
        setShowVideoDialog(true)
      } else {
        toast({
          title: "No Video",
          description: "There is no video to preview",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  const startAddingChapter = useCallback((unitId: string) => {
    setAddingToUnitId(unitId)
    setNewChapter({ title: "", youtubeId: "" })
  }, [])

  const addNewChapter = useCallback(() => {
    if (!addingToUnitId) return

    if (!newChapter.title.trim()) {
      toast({
        title: "Error",
        description: "Chapter title is required",
        variant: "destructive",
      })
      return
    }

    let youtubeId = null

    if (newChapter.youtubeId.trim()) {
      youtubeId = extractYoutubeIdFromUrl(newChapter.youtubeId.trim())

      if (!youtubeId) {
        toast({
          title: "Error",
          description: "Please enter a valid YouTube URL or ID",
          variant: "destructive",
        })
        return
      }
    }

    setCourse(prevCourse => {
      const newCourseData = JSON.parse(JSON.stringify(prevCourse))
      const unitIndex = newCourseData.units.findIndex((unit: CourseUnit) => String(unit.id) === addingToUnitId)

      if (unitIndex !== -1) {
        const newChapterId = `new-${Date.now()}`
        const newChapterObj = {
          id: newChapterId,
          title: newChapter.title,
          unitId: addingToUnitId,
          content: "",
          youtubeSearchQuery: newChapter.title,
          videoId: youtubeId,
          videoStatus: youtubeId ? "completed" : null,
        }

        newCourseData.units[unitIndex].chapters.push(newChapterObj)

        if (youtubeId) {
          setCompletedChapters(prev => {
            const newSet = new Set(prev)
            newSet.add(newChapterId)
            return newSet
          })
        }
      }

      return newCourseData
    })

    setAddingToUnitId(null)
    setNewChapter({ title: "", youtubeId: "" })

    toast({
      title: "Chapter Added",
      description: `${newChapter.title} has been added to the unit`,
    })
  }, [addingToUnitId, newChapter, extractYoutubeIdFromUrl, toast])

  const cancelAddingChapter = useCallback(() => {
    setAddingToUnitId(null)
  }, [])

  const handleDragEnd = useCallback(
    (result: any) => {
      const { destination, source } = result

      if (!destination) return
      if (destination.droppableId === source.droppableId && destination.index === source.index) return

      setCourse(prevCourse => {
        const newCourse = JSON.parse(JSON.stringify(prevCourse))

        const sourceUnitId = source.droppableId.replace("unit-", "")
        const destUnitId = destination.droppableId.replace("unit-", "")

        const sourceUnitIndex = newCourse.units.findIndex((u: CourseUnit) => String(u.id) === sourceUnitId)
        const destUnitIndex = newCourse.units.findIndex((u: CourseUnit) => String(u.id) === destUnitId)

        if (sourceUnitIndex === -1 || destUnitIndex === -1) return prevCourse

        const sourceChapters = newCourse.units[sourceUnitIndex].chapters
        const destChapters = sourceUnitIndex === destUnitIndex ? sourceChapters : newCourse.units[destUnitIndex].chapters

        const [removed] = sourceChapters.splice(source.index, 1)

        if (sourceUnitId !== destUnitId) {
          removed.unitId = destUnitId
        }

        destChapters.splice(destination.index, 0, removed)

        return newCourse
      })

      toast({
        title: "Chapter Moved",
        description: "Chapter moved successfully",
      })
    },
    [toast],
  )

  const prepareUpdateData = useCallback(() => {
    return {
      courseId: course.id,
      slug: course.slug,
      units: course.units.map((unit) => ({
        id: unit.id,
        chapters: unit.chapters.map((chapter, index) => {
          const isNewChapter = typeof chapter.id === "string"

          return {
            id: isNewChapter ? null : chapter.id,
            title: chapter.title,
            videoId: chapter.videoId || null,
            unitId: unit.id,
            position: index,
            ...(chapter.youtubeSearchQuery ? { youtubeSearchQuery: chapter.youtubeSearchQuery } : {}),
          }
        }),
      })),
    }
  }, [course])

  return {
    course,
    completedChapters,
    editingChapterId,
    editingChapterTitle,
    showVideoDialog,
    setShowVideoDialog,
    currentVideoId,
    currentVideoTitle,
    newChapter,
    setNewChapter,
    addingToUnitId,
    isSaving,
    isGeneratingVideos,
    chapterRefs,
    generationStatuses,
    videoStatuses: statuses,
    queueStatus,
    totalChaptersCount,
    progress,
    allChaptersCompleted,
    handleChapterComplete,
    handleGenerateAll,
    startEditingChapter,
    saveChapterTitle,
    cancelEditingChapter,
    setEditingChapterTitle,
    showVideo,
    startAddingChapter,
    addNewChapter,
    cancelAddingChapter,
    handleDragEnd,
    extractYoutubeIdFromUrl,
    generateVideoForChapter,
    cancelVideoProcessing: cancelProcessing,
    prepareUpdateData,
  }
}