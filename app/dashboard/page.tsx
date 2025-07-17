"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useGlobalLoader } from "@/store/global-loader"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/modules/auth"
import { PageWrapper, PageHeader } from "@/components/layout/PageWrapper"

// Dynamically import the CourseList component to avoid hydration issues
const CourseList = dynamic(() => import("@/components/features/home/CourseLists"), {
  ssr: false,
  loading: () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 space-y-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
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
