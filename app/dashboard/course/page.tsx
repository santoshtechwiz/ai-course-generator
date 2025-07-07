"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { LoadingSkeleton } from "@/components/ui/SkeletonLoader"

/**
 * This is a redirection page for /dashboard/course
 * It redirects to the dashboard/course/create page which is the main course creation page
 */
export default function CoursePage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/dashboard/course/create")
  }, [router])

  return <LoadingSkeleton />
}
