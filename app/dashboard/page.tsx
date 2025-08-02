"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useGlobalLoader } from "@/store/loaders/global-loader"
import { GlobalLoader } from "@/components/ui/loader"
import { useAuth } from "@/modules/auth"
import { PageWrapper, PageHeader } from "@/components/layout/PageWrapper"

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
    <PageWrapper>
      <PageHeader title="Explore Courses" description={""}>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-8 text-center">
          Discover interactive quizzes designed to enhance your learning experience and test your knowledge
        </p>
        <CourseList url={url} userId={userId} />
      </PageHeader>
    </PageWrapper>
  )
}
