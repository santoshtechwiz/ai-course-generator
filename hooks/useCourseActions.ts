"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/modules/auth"
import courseStatusFetcher, { notifyUnauthorizedOnce } from '@/utils/course-status-fetcher'

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
  const { isAuthenticated } = useAuth() // ✅ Your global auth state
  const router = useRouter()
  const fetchCourseStatus = useCallback(async () => {
     if (!isAuthenticated) return // ✅ Prevent API call when not authenticated
    try {
      setLoading("status")
      const res = await courseStatusFetcher.getCourseStatus(slug)
      if (res.status === 401) {
        // Notify once and then stop further attempts until login
        notifyUnauthorizedOnce(slug, () => {
          toast({ title: 'Sign in required', description: 'Sign in to view course status.', variant: 'default' })
        })
        setStatus({ isPublic: false, isFavorite: false, rating: null })
        return
      }

      if (res.status === 200 && res.data) {
        setStatus(res.data)
        return
      }

      if (res.status === 404) {
        // Not found - use defaults
        setStatus({ isPublic: false, isFavorite: false, rating: null })
        return
      }

      // For other non-ok statuses, fall back to defaults and notify
      console.warn(`Failed to fetch course status for ${slug} - status ${res.status}`)
      toast({ title: 'Warning', description: 'Could not fetch course status. Using defaults.', variant: 'default' })
      setStatus({ isPublic: false, isFavorite: false, rating: null })
    } finally {
      setLoading(null)
    }
  }, [slug, isAuthenticated])

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
        }        if (!response || !response.ok) {
          throw new Error(`Failed to perform action: ${response?.statusText || 'Unknown error'}`)
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
