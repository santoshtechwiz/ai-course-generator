"use client"

import React from "react"
import { useState, useCallback, useMemo, useRef } from "react"
import { useToast } from "@/hooks"
import { api } from "@/lib/api-helper"
import { useRouter } from "next/navigation"
import type { Course, CourseUnit, Chapter } from "@prisma/client"
import type { ChapterCardHandler } from "../components/EnhancedChapterCard"
import { useVideoProcessing } from "./useVideoProcessing"

export type CourseWithUnits = Course & {
  units: (CourseUnit & {
    chapters: Chapter[]
  })[]
}

export type ChapterStatus = "idle" | "processing" | "success" | "error"

export interface ChapterGenerationStatus {
  status: ChapterStatus
  message?: string
}

/**
 * Enhanced version of useCourseEditor with improved video processing
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
  // Use our enhanced video processing
  const { processVideo, processMultipleVideos, cancelProcessing, isProcessing, statuses, queueStatus } =
    useVideoProcessing({
      useEnhancedService: false, // Use standard API instead of enhanced
      onComplete: (status) => {
        console.log(`Video completed for chapter ${status.chapterId}:`, status)
        handleChapterComplete(String(status.chapterId))

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
      },
      onError: (status) => {
        console.error(`Video failed for chapter ${status.chapterId}:`, status)
      },
    })

  // Computed values
  const totalChaptersCount = useMemo(() => {
    return course.units.reduce((acc, unit) => acc + unit.chapters.length, 0)
  }, [course.units])
  // Calculate chapters currently being processed
  const processingChaptersCount = useMemo(() => {
    const count = Object.values(isProcessing).filter(Boolean).length
    console.log(`📊 Processing chapters count: ${count}`, isProcessing)
    return count
  }, [isProcessing])

  // Calculate overall progress
  const progress = useMemo(() => {
    return (completedChapters.size / Math.max(1, totalChaptersCount)) * 100
  }, [completedChapters.size, totalChaptersCount])

  // Check if all chapters are completed
  const allChaptersCompleted = useMemo(() => {
    return completedChapters.size === totalChaptersCount && totalChaptersCount > 0
  }, [completedChapters.size, totalChaptersCount])

  // Calculate if videos are currently being generated
  const isGeneratingVideos = useMemo(() => {
    return processingChaptersCount > 0
  }, [processingChaptersCount])

  // Initialize chapter refs when course changes
  React.useEffect(() => {
    course.units.forEach((unit) => {
      unit.chapters.forEach((chapter) => {
        const chapterId = String(chapter.id)
        if (!chapterRefs.current[chapterId]) {
          chapterRefs.current[chapterId] = React.createRef()
        }
      })
    })
  }, [course])

  // Utility function to extract YouTube ID from URL or direct ID
  const extractYoutubeIdFromUrl = useCallback((url: string): string | null => {
    try {
      // Handle youtube.com/watch?v=VIDEO_ID
      if (url.includes("youtube.com/watch")) {
        const urlObj = new URL(url)
        return urlObj.searchParams.get("v")
      }

      // Handle youtu.be/VIDEO_ID
      if (url.includes("youtu.be/")) {
        const urlObj = new URL(url)
        return urlObj.pathname.substring(1)
      }

      // Handle youtube.com/embed/VIDEO_ID
      if (url.includes("youtube.com/embed/")) {
        const urlObj = new URL(url)
        return urlObj.pathname.split("/").pop() || null
      }

      // If it's just an ID (11 characters)
      if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url
      }

      return null
    } catch (e) {
      return null
    }
  }, [])

  // Handler functions
  const handleChapterComplete = useCallback((chapterId: string) => {
    setCompletedChapters((prev) => new Set(prev).add(chapterId))
  }, [])
  // Generate videos for all chapters that don't have videos (sequential, with UX)
  const handleGenerateAll = useCallback(
    async (retryFailed = false) => {
      console.log("🔍 handleGenerateAll called - USER INITIATED", {
        retryFailed,
        units: course.units.map((unit) => ({
          id: unit.id,
          name: unit.name,
          chapterCount: unit.chapters.length,
        })),
      })

      const allChapters = course.units.flatMap((unit) => unit.chapters)
      console.log(`📊 Total chapters found: ${allChapters.length}`)

      let chaptersToProcess = allChapters.filter((chapter) => !chapter.videoId)
      console.log(`📊 Chapters without videos: ${chaptersToProcess.length}`)

      if (retryFailed) {
        // Only retry chapters with error/timeout
        chaptersToProcess = allChapters.filter((chapter) => statuses[chapter.id]?.status === "error")
        console.log(`📊 Chapters with errors to retry: ${chaptersToProcess.length}`)
      }

      if (chaptersToProcess.length === 0) {
        console.log("⚠️ No chapters to process!")
        toast({
          title: retryFailed ? "No failed chapters" : "All videos ready",
          description: retryFailed
            ? "No chapters need retry."
            : allChapters.length > 0
              ? "All chapters already have videos"
              : "Please add chapters to your course first",
        })
        // Mark all chapters as completed
        const newCompletedChapters = new Set(completedChapters)
        allChapters.forEach((chapter) => {
          newCompletedChapters.add(String(chapter.id))
        })
        setCompletedChapters(newCompletedChapters)
        return true
      }

      toast({
        title: retryFailed ? "Retrying failed videos" : "Generating videos",
        description: `${retryFailed ? "Retrying" : "Starting video generation for"} ${chaptersToProcess.length} chapters`,
      })

      // Sequential processing
      const chapterIds = chaptersToProcess.map((chapter) => chapter.id)
      const result = await processMultipleVideos(chapterIds, { retryFailed })

      toast({
        title: result.success ? "Success" : result.failed ? "Some videos failed" : "Partial success",
        description:
          `Generated videos for ${result.processed} out of ${chaptersToProcess.length} chapters` +
          (result.failed ? `. ${result.failed} failed.` : ""),
        variant: result.processed === 0 ? "destructive" : "default",
      })

      return result.success
    },
    [course.units, completedChapters, processMultipleVideos, statuses, toast],
  )

  // Retry handler for failed/timeouts
  const retryFailedChapters = useCallback(async () => {
    await handleGenerateAll(true)
  }, [handleGenerateAll])

  // Generate video for a single chapter
  const generateVideoForChapter = useCallback(
    async (chapter: Chapter): Promise<boolean> => {
      const chapterId = String(chapter.id)

      try {
        // Process video using our enhanced service
        await processVideo(chapter.id)
        return true
      } catch (error) {
        console.error(`Error generating video for chapter ${chapterId}:`, error)
        return false
      }
    },
    [processVideo],
  )

  // Other handlers...
  const startEditingChapter = useCallback((chapter: Chapter) => {
    setEditingChapterId(String(chapter.id))
    setEditingChapterTitle(chapter.title)
  }, [])

  const saveChapterTitle = useCallback(() => {
    if (!editingChapterId) return

    const newCourse = JSON.parse(JSON.stringify(course))

    for (const unit of newCourse.units) {
      const chapterIndex = unit.chapters.findIndex((ch: Chapter) => String(ch.id) === editingChapterId)
      if (chapterIndex !== -1) {
        unit.chapters[chapterIndex].title = editingChapterTitle
        unit.chapters[chapterIndex].youtubeSearchQuery = editingChapterTitle
        break
      }
    }

    setCourse(newCourse)
    setEditingChapterId(null)
  }, [course, editingChapterId, editingChapterTitle])

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

    // Only validate YouTube ID if one was provided
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

    const newCourseData = JSON.parse(JSON.stringify(course))
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
      setCourse(newCourseData)

      if (youtubeId) {
        handleChapterComplete(newChapterId)
      }

      setAddingToUnitId(null)
      setNewChapter({ title: "", youtubeId: "" })

      toast({
        title: "Chapter Added",
        description: `${newChapter.title} has been added to the unit`,
      })
    }
  }, [course, addingToUnitId, newChapter, extractYoutubeIdFromUrl, handleChapterComplete, toast])

  const cancelAddingChapter = useCallback(() => {
    setAddingToUnitId(null)
  }, [])

  const handleDragEnd = useCallback(
    (result: any) => {
      const { destination, source, draggableId } = result

      // Check if we have a valid destination
      if (!destination) {
        return
      }

      // Check if the item was actually moved
      if (destination.droppableId === source.droppableId && destination.index === source.index) {
        return
      }

      const newCourse = JSON.parse(JSON.stringify(course))

      // Get source and destination unit IDs from droppableId strings
      const sourceUnitId = source.droppableId.replace("unit-", "")
      const destUnitId = destination.droppableId.replace("unit-", "")

      // Find source and destination units
      const sourceUnitIndex = newCourse.units.findIndex((u: CourseUnit) => String(u.id) === sourceUnitId)
      const destUnitIndex = newCourse.units.findIndex((u: CourseUnit) => String(u.id) === destUnitId)

      if (sourceUnitIndex === -1 || destUnitIndex === -1) {
        return
      }

      const sourceChapters = newCourse.units[sourceUnitIndex].chapters
      const destChapters = sourceUnitIndex === destUnitIndex ? sourceChapters : newCourse.units[destUnitIndex].chapters

      // Remove from source
      const [removed] = sourceChapters.splice(source.index, 1)

      // Update unitId if moving to a different unit
      if (sourceUnitId !== destUnitId) {
        removed.unitId = destUnitId
      }

      // Insert at destination
      destChapters.splice(destination.index, 0, removed)

      setCourse(newCourse)

      toast({
        title: "Chapter Moved",
        description: `${removed.title} has been moved successfully`,
      })
    },
    [course, toast],
  )
  const prepareUpdateData = useCallback(() => {
    return {
      courseId: course.id,
      slug: course.slug,
      units: course.units.map((unit) => ({
        id: unit.id,
        chapters: unit.chapters.map((chapter, index) => {
          // Handle new chapters which may have string IDs
          const isNewChapter = typeof chapter.id === "string"

          return {
            id: isNewChapter ? null : chapter.id,
            title: chapter.title,
            videoId: chapter.videoId || null,
            unitId: unit.id,
            position: index,
            // Only include these if they exist in the chapter object
            ...(chapter.youtubeSearchQuery ? { youtubeSearchQuery: chapter.youtubeSearchQuery } : {}),
          }
        }),
      })),
    }
  }, [course])

  const saveAndContinue = useCallback(async () => {
    setIsSaving(true)
    try {
      // Check if there are any chapters to save
      const allChapters = course.units.flatMap((unit) => unit.chapters)
      console.log(`📋 saveAndContinue: Found ${allChapters.length} chapters in ${course.units.length} units`)

      // First, save the current course structure to database
      const updateData = prepareUpdateData()

      // Debug: Log the data being sent
      console.log("Sending update data to API:", JSON.stringify(updateData, null, 2))

      // Save to database using the existing course update API
      const saveResponse = await api.post(`/api/course/update-chapters`, updateData)
      if (!saveResponse.data.success) {
        throw new Error(saveResponse.data.error || "Failed to save course structure")
      }

      toast({
        title: "Course Structure Saved",
        description: "Course saved successfully!",
      })

      // If we have no chapters, inform the user and redirect
      if (allChapters.length === 0) {
        toast({
          title: "No Chapters Found",
          description: "Please add chapters to your course before generating videos.",
        })
        router.push(`/dashboard/course/${course.slug}`)
        return
      }

      // Check if user wants to generate videos
      const chaptersNeedingVideos = allChapters.filter((chapter) => !chapter.videoId)
      if (chaptersNeedingVideos.length > 0) {
        console.log(`🎬 User initiated video generation for ${chaptersNeedingVideos.length} chapters`)

        toast({
          title: "Starting Video Generation",
          description: `Generating videos for ${chaptersNeedingVideos.length} chapters...`,
        })

        try {
          // Start video generation process
          await handleGenerateAll() // This will use the existing video generation logic

          // After successful generation, show success message
          toast({
            title: "Videos Generated Successfully!",
            description: "All videos have been generated. Redirecting to your course...",
          })

          // Wait a moment for user to see the success message, then redirect
          setTimeout(() => {
            router.push(`/dashboard/course/${course.slug}`)
          }, 2000)
        } catch (videoError) {
          console.error("Video generation failed:", videoError)
          // Don't redirect on video generation failure - stay on page for retry
          toast({
            title: "Video Generation Failed",
            description: "Some videos failed to generate. You can retry from the options above.",
            variant: "destructive",
          })
        }
      } else {
        // All chapters already have videos, can redirect immediately
        toast({
          title: "Course Ready",
          description: "Course is ready! Redirecting...",
        })

        setTimeout(() => {
          router.push(`/dashboard/course/${course.slug}`)
        }, 1500)
      }
    } catch (error) {
      console.error("Error in saveAndContinue:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save course",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [course.slug, course.units, prepareUpdateData, router, toast, handleGenerateAll])

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
    saveAndContinue,
    extractYoutubeIdFromUrl,
    generateVideoForChapter,
    cancelVideoProcessing: cancelProcessing,
    prepareUpdateData,
  }
}
