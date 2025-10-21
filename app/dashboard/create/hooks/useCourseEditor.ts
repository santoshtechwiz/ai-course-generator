"use client"

import React from "react"
import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { useToast } from "@/hooks"
import { api } from "@/lib/api-helper"
import { useRouter } from "next/navigation"
import type { Course, CourseUnit, Chapter } from "@prisma/client"
import type { ChapterCardHandler, ChapterStatus, ChapterGenerationStatus } from "../types"

// Re-export for backward compatibility
export type {   ChapterGenerationStatus }

type CourseWithUnits = Course & {
  units: (CourseUnit & {
    chapters: Chapter[]
  })[]
}

function useCourseEditor(initialCourse: CourseWithUnits) {
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
  const [isGeneratingVideos, setIsGeneratingVideos] = useState(false)
  const [generationStatuses, setGenerationStatuses] = useState<Record<string, ChapterGenerationStatus>>({})

  // Refs for chapter components
  const chapterRefs = useRef<Record<string, React.RefObject<ChapterCardHandler>>>({})

  // Computed values
  const totalChaptersCount = useMemo(() => {
    return course.units.reduce((acc, unit) => acc + unit.chapters.length, 0)
  }, [course.units])

  const progress = useMemo(
    () => (completedChapters.size / Math.max(1, totalChaptersCount)) * 100,
    [completedChapters.size, totalChaptersCount],
  )

  const allChaptersCompleted = useMemo(
    () => completedChapters.size === totalChaptersCount && totalChaptersCount > 0,
    [completedChapters.size, totalChaptersCount],
  )

  // Initialize chapter refs when course changes
  useEffect(() => {
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

  const handleGenerateAll = useCallback(() => {
    // Don't auto-mark chapters as completed - wait for explicit user action
    console.log("handleGenerateAll called - user initiated video generation")

    // Show confirmation toast
    toast({
      title: "Starting Video Generation",
      description: "Generating videos for all chapters without existing videos...",
    })

    // Mark all chapters as completed immediately for UI feedback
    const allChapters = course.units.flatMap((unit) => unit.chapters)
    const newCompletedChapters = new Set(completedChapters)

    allChapters.forEach((chapter) => {
      newCompletedChapters.add(String(chapter.id))
    })

    setCompletedChapters(newCompletedChapters)
  }, [course.units, completedChapters, toast])

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

      newCourseData.units[unitIndex].chapters.push({
        id: newChapterId,
        title: newChapter.title,
        videoId: youtubeId,
        unitId: Number(addingToUnitId),
        createdAt: new Date(),
        updatedAt: new Date(),
        youtubeSearchQuery: newChapter.title,
        videoStatus: youtubeId ? "completed" : "idle",
        summary: "Custom chapter created by user",
        summaryStatus: "COMPLETED",
        order: newCourseData.units[unitIndex].chapters.length,
        isCompleted: false,
      })

      // Create a ref for the new chapter
      chapterRefs.current[newChapterId] = React.createRef()

      // Mark the new chapter as completed if it has a video ID
      if (youtubeId) {
        setCompletedChapters((prev) => new Set(prev).add(newChapterId))
      }
    }

    setCourse(newCourseData)
    setAddingToUnitId(null)
    setNewChapter({ title: "", youtubeId: "" })

    toast({
      title: "Success",
      description: "New chapter added successfully",
    })
  }, [addingToUnitId, course, extractYoutubeIdFromUrl, newChapter, toast])

  const cancelAddingChapter = useCallback(() => {
    setAddingToUnitId(null)
  }, [])

  // Handle drag and drop reordering
  const handleDragEnd = useCallback(
    (result: any) => {
      if (!result.destination) return

      const { source, destination } = result
      const sourceUnitId = source.droppableId.replace("unit-", "")
      const destUnitId = destination.droppableId.replace("unit-", "")

      // Create a deep copy of the course
      const newCourse = JSON.parse(JSON.stringify(course))

      // Find the source and destination units
      const sourceUnitIndex = newCourse.units.findIndex((unit: CourseUnit) => String(unit.id) === sourceUnitId)
      const destUnitIndex = newCourse.units.findIndex((unit: CourseUnit) => String(unit.id) === destUnitId)

      if (sourceUnitIndex === -1 || destUnitIndex === -1) {
        console.error("Could not find source or destination unit", { sourceUnitId, destUnitId })
        return
      }

      // If reordering within the same unit
      if (sourceUnitId === destUnitId) {
        const chapters = [...newCourse.units[sourceUnitIndex].chapters]
        const [removed] = chapters.splice(source.index, 1)
        chapters.splice(destination.index, 0, removed)
        newCourse.units[sourceUnitIndex].chapters = chapters
      } else {
        // Moving between units
        const sourceChapters = [...newCourse.units[sourceUnitIndex].chapters]
        const destChapters = [...newCourse.units[destUnitIndex].chapters]

        const [removed] = sourceChapters.splice(source.index, 1)
        // Update the unitId of the chapter being moved
        removed.unitId = Number(destUnitId)
        destChapters.splice(destination.index, 0, removed)

        newCourse.units[sourceUnitIndex].chapters = sourceChapters
        newCourse.units[destUnitIndex].chapters = destChapters
      }

      setCourse(newCourse)
    },
    [course],
  )

  // Generate video for a specific chapter
  const generateVideoForChapter = useCallback(
    async (chapter: Chapter): Promise<boolean> => {
      const chapterId = String(chapter.id)

      // Skip if chapter already has a video
      if (chapter.videoId) {
        setGenerationStatuses((prev) => ({
          ...prev,
          [chapterId]: { status: "success", message: "Video already exists" },
        }))
        handleChapterComplete(chapterId)
        return true
      }

      // Skip if chapter is already being processed
      if (generationStatuses[chapterId]?.status === "processing") {
        return false
      }

      try {
        // Update status to processing
        setGenerationStatuses((prev) => ({
          ...prev,
          [chapterId]: { status: "processing", message: "Generating video..." },
        }))

        // Call the API to generate video
        const response = await api.post("/api/video", { chapterId: chapter.id })

        if (response.data.success) {
          // Start polling for video status
          return await pollVideoStatus(chapter)
        } else {
          throw new Error(response.data.error || "Failed to start video generation")
        }
      } catch (error) {
        console.error(`Error generating video for chapter ${chapterId}:`, error)
        setGenerationStatuses((prev) => ({
          ...prev,
          [chapterId]: {
            status: "error",
            message: error instanceof Error ? error.message : "Failed to generate video",
          },
        }))
        return false
      }
    },
    [generationStatuses, handleChapterComplete],
  )

  // Poll for video status
  const pollVideoStatus = useCallback(
    async (chapter: Chapter): Promise<boolean> => {
      const chapterId = String(chapter.id)
      const maxAttempts = 30 // 5 minutes (10 seconds * 30)
      let attempts = 0

      return new Promise((resolve) => {
        const checkStatus = async () => {
          try {
            const response = await api.get(`/video/status/${chapter.id}`)
            const data = response.data

            // Update chapter in course state if video is ready
            if (data.videoId) {
              setCourse((prevCourse) => {
                const newCourse = JSON.parse(JSON.stringify(prevCourse))
                for (const unit of newCourse.units) {
                  const chapterIndex = unit.chapters.findIndex((ch: Chapter) => String(ch.id) === chapterId)
                  if (chapterIndex !== -1) {
                    unit.chapters[chapterIndex].videoId = data.videoId
                    unit.chapters[chapterIndex].videoStatus = "completed"
                    break
                  }
                }
                return newCourse
              })

              setGenerationStatuses((prev) => ({
                ...prev,
                [chapterId]: { status: "success", message: "Video generated successfully" },
              }))

              handleChapterComplete(chapterId)
              resolve(true)
              return
            }

            // Check if there was an error
            if (data.status === "error") {
              setGenerationStatuses((prev) => ({
                ...prev,
                [chapterId]: { status: "error", message: "Failed to generate video" },
              }))
              resolve(false)
              return
            }

            // Continue polling if still processing
            attempts++
            if (attempts >= maxAttempts) {
              setGenerationStatuses((prev) => ({
                ...prev,
                [chapterId]: { status: "error", message: "Timeout: Video generation took too long" },
              }))
              resolve(false)
              return
            }

            // Check again after 10 seconds
            setTimeout(checkStatus, 10000)
          } catch (error) {
            console.error(`Error checking video status for chapter ${chapterId}:`, error)
            setGenerationStatuses((prev) => ({
              ...prev,
              [chapterId]: { status: "error", message: "Error checking video status" },
            }))
            resolve(false)
          }
        }

        // Start checking
        checkStatus()
      })
    },
    [handleChapterComplete],
  )

  // Generate videos for all chapters that don't have videos
  const generateAllVideos = useCallback(async () => {
    setIsGeneratingVideos(true)

    try {
      const allChapters = course.units.flatMap((unit) => unit.chapters)
      const chaptersWithoutVideos = allChapters.filter((chapter) => !chapter.videoId)

      if (chaptersWithoutVideos.length === 0) {
        toast({
          title: "All videos ready",
          description: "All chapters already have videos",
        })
        setIsGeneratingVideos(false)
        return true
      }

      toast({
        title: "Generating videos",
        description: `Starting video generation for ${chaptersWithoutVideos.length} chapters`,
      })

      // Process chapters in batches of 3 to avoid overwhelming the server
      const batchSize = 3
      const results: boolean[] = []

      for (let i = 0; i < chaptersWithoutVideos.length; i += batchSize) {
        const batch = chaptersWithoutVideos.slice(i, i + batchSize)
        const batchResults = await Promise.all(batch.map((chapter) => generateVideoForChapter(chapter)))
        results.push(...batchResults)

        // Small delay between batches
        if (i + batchSize < chaptersWithoutVideos.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
      }

      const successCount = results.filter(Boolean).length

      toast({
        title: successCount === chaptersWithoutVideos.length ? "Success" : "Partial success",
        description: `Generated videos for ${successCount} out of ${chaptersWithoutVideos.length} chapters`,
        variant: successCount === 0 ? "destructive" : "default",
      })

      return successCount > 0
    } catch (error) {
      console.error("Error generating videos:", error)
      toast({
        title: "Error",
        description: "Failed to generate videos",
        variant: "destructive",
      })
      return false
    } finally {
      setIsGeneratingVideos(false)
    }
  }, [course.units, generateVideoForChapter, toast])

  // Prepare data for API
  const prepareUpdateData = useCallback(() => {
    return {
      courseId: course.id,
      slug: course.slug,
      units: course.units.map((unit) => ({
        id: unit.id,
        chapters: unit.chapters.map((chapter, index) => ({
          id: String(chapter.id).startsWith("new-") ? null : chapter.id,
          title: chapter.title,
          videoId: chapter.videoId,
          unitId: unit.id,
          position: index,
          isCustom: chapter.summary?.includes("Custom chapter") || String(chapter.id).startsWith("new-"),
          youtubeSearchQuery: chapter.youtubeSearchQuery || chapter.title,
        })),
      })),
    }
  }, [course])

  const saveAndContinue = useCallback(async () => {
    try {
      setIsSaving(true)

      // Check if there are chapters without videos
      const allChapters = course.units.flatMap((unit) => unit.chapters)
      const chaptersWithoutVideos = allChapters.filter((chapter) => !chapter.videoId)

      if (chaptersWithoutVideos.length > 0) {
        // Ask user if they want to generate videos
        toast({
          title: "Generating Videos",
          description: `Starting video generation for ${chaptersWithoutVideos.length} chapters...`,
        })

        // Generate videos for all chapters
        await generateAllVideos()
      }

      // Prepare data for API
      const updatedCourse = prepareUpdateData()

      // Save the updated course structure
      const response = await api.post("/api/course/update-chapters", updatedCourse)

      toast({
        title: "Success",
        description: "Course structure saved successfully",
      })

      // Redirect to the course page
      router.push(`/dashboard/course/${course.slug}`)
    } catch (error) {
      console.error("Error saving course:", error)

      // More specific error handling
      if (error instanceof Error && error.message.includes('401')) {
        toast({
          title: "Authorization Error",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to save course changes. Please try again.",
          variant: "destructive",
        })
      }
      setIsSaving(false)
    }
  }, [course.slug, generateAllVideos, prepareUpdateData, router, toast])

  // Get generation status for a chapter
  const getChapterGenerationStatus = useCallback(
    (chapterId: string): ChapterGenerationStatus => {
      // If chapter has a status, return it
      if (generationStatuses[chapterId]) {
        return generationStatuses[chapterId]
      }

      // Find the chapter
      const chapter = course.units.flatMap((unit) => unit.chapters).find((chapter) => String(chapter.id) === chapterId)

      // If chapter has a video, it's successful
      if (chapter?.videoId) {
        return { status: "success" }
      }

      // Default status
      return { status: "idle" }
    },
    [course.units, generationStatuses],
  )

  return {
    // State
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

    // Computed values
    totalChaptersCount,
    progress,
    allChaptersCompleted,

    // Methods
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
    generateAllVideos,
    getChapterGenerationStatus,
  }
}
