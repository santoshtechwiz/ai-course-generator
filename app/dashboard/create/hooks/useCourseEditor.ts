/**
 * app/dashboard/create/hooks/useCourseEditor.ts
 * 
 * OPTIMIZED: Stable course editor with instant UI updates
 * - Stable callback references
 * - Optimized state updates
 * - Better video status synchronization
 */

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

  // Refs for chapter components and callbacks
  const chapterRefs = useRef<Record<string, React.RefObject<ChapterCardHandler>>>({})
  const toastShownRef = useRef<Set<string>>(new Set())
  
  // Stable callback wrapper to prevent recreating toast notifications
  const showToastOnce = useCallback((key: string, message: string, type: 'success' | 'error' = 'success') => {
    if (toastShownRef.current.has(key)) return
    
    toastShownRef.current.add(key)
    toast({
      title: type === 'success' ? 'Success' : 'Error',
      description: message,
      variant: type === 'error' ? 'destructive' : 'default'
    })
    
    // Clear after 3 seconds
    setTimeout(() => {
      toastShownRef.current.delete(key)
    }, 3000)
  }, [toast])
  
  // Use unified video processing hook with stable callbacks
  const videoProcessing = useVideoProcessing({
    onComplete: useCallback((status) => {
      handleChapterComplete(String(status.chapterId))
      
      // Update course state with new video ID
      if (status.videoId) {
        setCourse((prevCourse) => {
          const newCourse = { ...prevCourse }
          newCourse.units = newCourse.units.map(unit => ({
            ...unit,
            chapters: unit.chapters.map(ch => 
              ch.id === status.chapterId 
                ? { ...ch, videoId: status.videoId, videoStatus: "completed" }
                : ch
            )
          }))
          return newCourse
        })
        
        showToastOnce(`complete-${status.chapterId}`, 'Video generated successfully!', 'success')
      }
    }, []),
    onError: useCallback((status) => {
      console.error(`Video failed for chapter ${status.chapterId}:`, status.message)
      showToastOnce(`error-${status.chapterId}`, status.message || 'Video generation failed', 'error')
    }, []),
    autoRetry: false,
  })

  const { 
    processVideo, 
    processMultipleVideos, 
    cancelProcessing, 
    retryVideo, 
    initializeChapterStatus, 
    isProcessing, 
    statuses, 
    queueStatus 
  } = videoProcessing

  // Memoized computed values
  const totalChaptersCount = useMemo(() => {
    return course.units.reduce((acc, unit) => acc + unit.chapters.length, 0)
  }, [course.units])

  const processingChaptersCount = useMemo(() => {
    return Object.values(isProcessing).filter(Boolean).length
  }, [isProcessing])

  const progress = useMemo(() => {
    return totalChaptersCount > 0 ? (completedChapters.size / totalChaptersCount) * 100 : 0
  }, [completedChapters.size, totalChaptersCount])

  const allChaptersCompleted = useMemo(() => {
    return completedChapters.size === totalChaptersCount && totalChaptersCount > 0
  }, [completedChapters.size, totalChaptersCount])

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
  }, [course.units])

  // Initialize chapters with existing videos - run once
  React.useEffect(() => {
    const allChapters = course.units.flatMap((unit) => unit.chapters)
    const chaptersWithVideos = allChapters.filter((chapter) => chapter.videoId)
    
    chaptersWithVideos.forEach((chapter) => {
      initializeChapterStatus(chapter.id, chapter.videoId)
      setCompletedChapters(prev => new Set(prev).add(String(chapter.id)))
    })
  }, []) // Run once on mount

  // Stable utility function
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

  // Stable handler functions
  const handleChapterComplete = useCallback((chapterId: string) => {
    setCompletedChapters((prev) => {
      const newSet = new Set(prev)
      newSet.add(chapterId)
      return newSet
    })
  }, [])

  const handleGenerateAll = useCallback(
    async (retryFailed = false) => {
      const allChapters = course.units.flatMap((unit) => unit.chapters)
      
      if (allChapters.length === 0) {
        toast({
          title: "No Chapters",
          description: "Please add chapters to your course first",
        })
        return false
      }

      let chaptersToProcess = allChapters.filter((chapter) => !chapter.videoId)

      if (retryFailed) {
        chaptersToProcess = allChapters.filter((chapter) => statuses[chapter.id]?.status === "error")
      }

      if (chaptersToProcess.length === 0) {
        toast({
          title: retryFailed ? "No Failed Chapters" : "All Videos Ready",
          description: retryFailed ? "No chapters need retry" : "All chapters already have videos",
        })
        
        // Mark all as completed
        setCompletedChapters(new Set(allChapters.map(ch => String(ch.id))))
        return true
      }

      const chapterIds = chaptersToProcess.map((chapter) => chapter.id)
      const result = await processMultipleVideos(chapterIds, { retryFailed })

      return result.success
    },
    [course.units, processMultipleVideos, statuses, toast],
  )

  const generateVideoForChapter = useCallback(
    async (chapter: Chapter): Promise<boolean> => {
      try {
        if (!chapter || typeof chapter.id !== 'number' || isNaN(chapter.id)) {
          console.error('Invalid chapter or chapter ID:', chapter)
          return false
        }
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
      const newCourse = { ...prevCourse }
      newCourse.units = newCourse.units.map(unit => ({
        ...unit,
        chapters: unit.chapters.map(ch => 
          String(ch.id) === editingChapterId
            ? { ...ch, title: editingChapterTitle, youtubeSearchQuery: editingChapterTitle }
            : ch
        )
      }))
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

    const newChapterId = `new-${Date.now()}`
    const newChapterObj = {
      id: newChapterId as any,
      title: newChapter.title,
      unitId: addingToUnitId as any,
      content: "",
      youtubeSearchQuery: newChapter.title,
      videoId: youtubeId,
      videoStatus: youtubeId ? "completed" as any : null,
    }

    setCourse(prevCourse => {
      const newCourse = { ...prevCourse }
      newCourse.units = newCourse.units.map(unit => 
        String(unit.id) === addingToUnitId
          ? { ...unit, chapters: [...unit.chapters, newChapterObj as any] }
          : unit
      )
      return newCourse
    })

    if (youtubeId) {
      handleChapterComplete(newChapterId)
    }

    setAddingToUnitId(null)
    setNewChapter({ title: "", youtubeId: "" })

    toast({
      title: "Chapter Added",
      description: `${newChapter.title} has been added to the unit`,
    })
  }, [addingToUnitId, newChapter, extractYoutubeIdFromUrl, handleChapterComplete, toast])

  const cancelAddingChapter = useCallback(() => {
    setAddingToUnitId(null)
  }, [])

  const handleDragEnd = useCallback(
    (result: any) => {
      const { destination, source } = result

      if (!destination) return
      if (destination.droppableId === source.droppableId && destination.index === source.index) return

      const sourceUnitId = source.droppableId.replace("unit-", "")
      const destUnitId = destination.droppableId.replace("unit-", "")

      setCourse(prevCourse => {
        const newCourse = { ...prevCourse }
        
        const sourceUnitIndex = newCourse.units.findIndex((u) => String(u.id) === sourceUnitId)
        const destUnitIndex = newCourse.units.findIndex((u) => String(u.id) === destUnitId)

        if (sourceUnitIndex === -1 || destUnitIndex === -1) return prevCourse

        const sourceChapters = [...newCourse.units[sourceUnitIndex].chapters]
        const destChapters = sourceUnitIndex === destUnitIndex ? sourceChapters : [...newCourse.units[destUnitIndex].chapters]

        const [removed] = sourceChapters.splice(source.index, 1)

        if (sourceUnitId !== destUnitId) {
          removed.unitId = destUnitId as any
        }

        destChapters.splice(destination.index, 0, removed)

        newCourse.units = newCourse.units.map((unit, idx) => {
          if (idx === sourceUnitIndex) {
            return { ...unit, chapters: sourceChapters }
          }
          if (idx === destUnitIndex && sourceUnitIndex !== destUnitIndex) {
            return { ...unit, chapters: destChapters }
          }
          return unit
        })

        return newCourse
      })

      toast({
        title: "Chapter Moved",
        description: "Chapter has been moved successfully",
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

  const saveAndContinue = useCallback(async () => {
    setIsSaving(true)
    try {
      const allChapters = course.units.flatMap((unit) => unit.chapters)

      if (allChapters.length === 0) {
        toast({
          title: "No Chapters Found",
          description: "Please add chapters to your course before saving",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      const updateData = prepareUpdateData()
      const saveResponse = await api.post(`/api/course/update-chapters`, updateData)

      const saveSuccess = saveResponse?.data?.success
      if (!saveSuccess) {
        throw new Error(saveResponse?.data?.error || "Failed to save course structure")
      }

      const chaptersNeedingVideos = allChapters.filter((chapter) => !chapter.videoId)
      
      if (chaptersNeedingVideos.length > 0) {
        const success = await handleGenerateAll()
        
        if (success) {
          toast({
            title: "Success!",
            description: "Course saved and all videos generated",
          })
          
          setTimeout(() => {
            router.push(`/dashboard/course/${course.slug}`)
          }, 2000)
        }
      } else {
        toast({
          title: "Course Ready",
          description: "Course saved successfully",
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
  }, [course, prepareUpdateData, handleGenerateAll, router, toast])

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
    retryVideoProcessing: retryVideo,
    prepareUpdateData,
    isProcessing,
  }
}