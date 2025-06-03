"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface CourseStatus {
  isPublic: boolean
  isFavorite: boolean
  rating: number | null
}

interface UseCourseActionsProps {
  slug: string
}

export function useCourseActions({ slug }: UseCourseActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [status, setStatus] = useState<CourseStatus>({ isPublic: false, isFavorite: false, rating: null })

  const router = useRouter()

  const fetchCourseStatus = useCallback(async () => {
    try {
      setLoading("status")
      const response = await fetch(`/api/course/${slug}/status`)
      if (!response.ok) {
        throw new Error(`Failed to fetch course status: ${response.statusText}`)
      }
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error("Error fetching course status:", error)
      toast({
        title: "Error",
        description: "Failed to fetch course status. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }, [slug])

  useEffect(() => {
    fetchCourseStatus()
  }, [fetchCourseStatus])

  const handleAction = useCallback(
    async (action: "privacy" | "favorite" | "delete") => {
      setLoading(action)
      try {
        let response
        if (action === "privacy" || action === "favorite") {
          const updateData = action === "privacy" ? { isPublic: !status.isPublic } : { isFavorite: !status.isFavorite }

          response = await fetch(`/api/course/${slug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
          })
        } else if (action === "delete") {
          response = await fetch(`/api/course/${slug}`, {
            method: "DELETE",
          })
        }

        if (!response.ok) {
          throw new Error(`Failed to perform action: ${response.statusText}`)
        }

        const result = await response.json()

        if (action === "privacy") {
          setStatus((prev) => ({ ...prev, isPublic: result.course.isPublic }))
          toast({
            title: "Course Privacy Updated",
            description: `Course is now ${result.course.isPublic ? "public" : "private"}.`,
          })
        } else if (action === "delete") {
          toast({
            title: "Course Deleted",
            description: "The course has been successfully deleted.",
          })
          router.push("/dashboard")
        } else if (action === "favorite") {
          setStatus((prev) => ({ ...prev, isFavorite: result.course.isFavorite }))
          toast({
            title: "Favorite Status Updated",
            description: `Course ${result.course.isFavorite ? "added to" : "removed from"} favorites.`,
          })
        }

        router.refresh()
      } catch (error) {
        console.error("Error handling action:", error)
        toast({
          title: "Error",
          description: `Failed to ${action} course. Please try again.`,
          variant: "destructive",
        })
      } finally {
        setLoading(null)
      }
    },
    [slug, status.isPublic, status.isFavorite, router],
  )

  const handleRating = useCallback(
    async (rating: number) => {
      setLoading("rating")
      try {
        const response = await fetch(`/api/course/${slug}/rate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating }),
        })

        if (!response.ok) {
          throw new Error(`Failed to submit rating: ${response.statusText}`)
        }

        await fetchCourseStatus() // Refresh status after rating
        toast({
          title: "Rating Updated",
          description: "Your rating has been successfully updated.",
        })
      } catch (error) {
        console.error("Error submitting rating:", error)
        toast({
          title: "Error",
          description: "Failed to update rating. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(null)
      }
    },
    [slug, fetchCourseStatus],
  )

  return { status, loading, handleAction, handleRating, fetchCourseStatus }
}
