"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useGlobalLoader } from "@/store/global-loader"
import { GlobalLoader } from "@/components/ui/loader"
import { useAuth } from "@/modules/auth"

// Dynamically import the CourseList component to avoid hydration issues
const CourseList = dynamic(() => import("@/components/features/home/CourseLists"), {
  ssr: false,
  loading: () => <GlobalLoader />,
})

const url = process.env.NEXT_PUBLIC_WEBSITE_URL
  ? `${process.env.NEXT_PUBLIC_WEBSITE_URL}/dashboard/explore`
  : "http://localhost:3000/dashboard/explore"

export default function CoursesPage() {
  const { user } = useAuth()
  const userId = user?.id || undefined

  return (
    <div className="min-h-screen">
      <div className="py-8 text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">Explore Courses</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Discover interactive quizzes designed to enhance your learning experience and test your knowledge
        </p>
      </div>

      <CourseList url={url} userId={userId} />
    </div>
  )
}
