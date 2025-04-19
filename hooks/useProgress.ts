"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import type { CourseProgress } from "@/app/types/types"

interface UseProgressProps {
  courseId: number
  initialProgress?: CourseProgress
  currentChapterId?: string
}

const useProgress = ({ courseId, initialProgress, currentChapterId }: UseProgressProps) => {
  const [progress, setProgress] = useState<CourseProgress | null>(initialProgress || null)
  const [isLoading, setIsLoading] = useState(true)
  const { data: session } = useSession()
  const pathname = usePathname()
  const previousProgressRef = useRef<string | null>(null)
  const isUpdatingRef = useRef(false)

  // Fetch progress data
  const fetchProgress = useCallback(async () => {
    if (!session?.user?.id || !courseId) return null

    try {
      setIsLoading(true)
      const response = await fetch(`/api/progress/${courseId}`)

      if (!response.ok) {
        console.error("Failed to fetch progress", response.statusText)
        return null
      }

      const data = await response.json()
      return data.progress
    } catch (error) {
      console.error("Error fetching progress:", error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [courseId, session?.user?.id])

  // Update progress data
  const updateProgress = useCallback(
    async (updateData: {
      currentChapterId?: number
      completedChapters?: number[]
      progress?: number
      currentUnitId?: number
      isCompleted?: boolean
      lastAccessedAt?: Date
    }) => {
      if (!session?.user?.id || !courseId || isUpdatingRef.current) return

      // Prevent concurrent updates
      isUpdatingRef.current = true

      try {
        const response = await fetch(`/api/progress/${courseId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        })

        if (!response.ok) {
          console.error("Failed to update progress", response.statusText)
          return
        }

        const updatedProgress = await response.json()

        // Only update state if the data has actually changed
        const progressString = JSON.stringify(updatedProgress.progress)
        if (progressString !== previousProgressRef.current) {
          setProgress(updatedProgress.progress)
          previousProgressRef.current = progressString
        }

        return updatedProgress.progress
      } catch (error) {
        console.error("Error updating progress:", error)
      } finally {
        isUpdatingRef.current = false
      }
    },
    [courseId, session?.user?.id],
  )

  // Load initial progress data
  useEffect(() => {
    if (session?.user?.id && courseId) {
      fetchProgress().then((progressData) => {
        if (progressData) {
          setProgress(progressData)
          previousProgressRef.current = JSON.stringify(progressData)
        }
      })
    } else {
      setIsLoading(false)
    }
  }, [fetchProgress, session?.user?.id, courseId])

  // Save progress to localStorage as a fallback
  useEffect(() => {
    if (progress && courseId) {
      localStorage.setItem(`course-progress-${courseId}`, JSON.stringify(progress))
    }
  }, [progress, courseId])

  // Load progress from localStorage if needed
  useEffect(() => {
    if (!progress && courseId && !isLoading) {
      const storedProgress = localStorage.getItem(`course-progress-${courseId}`)
      if (storedProgress) {
        try {
          const parsedProgress = JSON.parse(storedProgress)
          setProgress(parsedProgress)
          previousProgressRef.current = storedProgress
        } catch (e) {
          console.error("Error parsing stored progress:", e)
        }
      }
    }
  }, [progress, courseId, isLoading])

  return {
    progress,
    isLoading,
    updateProgress,
  }
}

export default useProgress
