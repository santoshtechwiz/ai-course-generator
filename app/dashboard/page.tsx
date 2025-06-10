"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

// Dynamically import the CourseList component to avoid hydration issues
const CourseList = dynamic(() => import("@/components/features/home/CourseLists"), {
  ssr: false,
  loading: () => <CoursesListSkeleton />,
})

// Import the skeleton component
import { CoursesListSkeleton } from "@/components/ui/loading/loading-skeleton"
import { hydrateQuiz } from "@/store/slices/quiz-slice"

const url = process.env.NEXT_PUBLIC_WEBSITE_URL
  ? `${process.env.NEXT_PUBLIC_WEBSITE_URL}/dashboard/explore`
  : "http://localhost:3000/dashboard/explore"

export default function CoursesPage() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Fetch the user ID on the client side
    const fetchUserId = async () => {
      try {
        const response = await fetch("/api/auth/session")
        const data = await response.json()
        setUserId(data?.user?.id || null)
      } catch (error) {
        console.error("Error fetching user session:", error)
        setUserId(null)
      }
    }

    fetchUserId()
  }, [])

  return (
    <div className="min-h-screen">
      <div className="py-8 text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">Explore Courses</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover interactive quizzes designed to enhance your learning experience and test your knowledge
        </p>
      </div>

      <CourseList url={url} userId={userId || undefined} />
    </div>
  )
}
