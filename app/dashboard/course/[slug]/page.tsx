import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo-utils"
import { getCourseData } from "@/app/actions/getCourseData"

import { notFound } from "next/navigation"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { JsonLd } from "@/app/schema/components/json-ld"
import { extractKeywords, generateMetaDescription } from "@/lib/seo-utils"
import CoursePage from "./components/CoursePage"
import type { FullCourseType } from "@/app/types/types"

function LoadingSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row w-full min-h-[calc(100vh-4rem)] gap-4 p-4 animate-pulse">
      <div className="flex-grow lg:w-3/4 space-y-6">
        {/* Video player skeleton */}
        <Skeleton className="w-full aspect-video rounded-lg" />

        {/* Title and description */}
        <div className="space-y-3">
          <Skeleton className="h-8 w-3/4 rounded-md" />
          <Skeleton className="h-4 w-1/2 rounded-md" />
        </div>

        {/* Content tabs */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>

          {/* Tab content */}
          <div className="space-y-4">
            <Skeleton className="h-40 w-full rounded-md" />
            <Skeleton className="h-40 w-full rounded-md" />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:w-1/4 lg:min-w-[300px] space-y-4">
        <Skeleton className="h-12 w-full rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        <div className="mt-6">
          <Skeleton className="h-40 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}

type CoursePageParams = {
  params: Promise<{ slug: string }>
}

// Generate metadata for the course page with improved typing
export async function generateMetadata({ params }: CoursePageParams): Promise<Metadata> {
  const { slug } = await params
  const course = await getCourseData(slug) as FullCourseType | null

  if (!course) {
    return generatePageMetadata({
      title: "Course Not Found | CourseAI",
      description: "The requested programming course could not be found. Explore our other coding education resources.",
      path: `/dashboard/course/${slug}`,
      noIndex: true,
    })
  }

  // Extract keywords from course content
  const contentKeywords = course.description ? extractKeywords(course.description, 5) : []

  // Extract keywords from course title and category
  const courseKeywords = course.title?.toLowerCase().split(" ") || []
  const categoryKeyword = course.category?.name?.toLowerCase() || ""

  // Create a more detailed description
  const enhancedDescription = course.description
    ? generateMetaDescription(course.description, 160)
    : `Master ${course.title} with our interactive coding course. Learn through AI-generated practice questions, hands-on exercises, and expert guidance. Perfect for ${course.difficulty || "all"} level developers.`

  return generatePageMetadata({
    title: `${course.title} Programming Course | Learn with AI`,
    description: enhancedDescription,
    path: `/dashboard/course/${slug}`,
    keywords: [
      `${course.title?.toLowerCase()} tutorial`,
      `${course.title?.toLowerCase()} programming`,
      `learn ${course.title?.toLowerCase()}`,
      `${course.title?.toLowerCase()} course`,
      `${categoryKeyword} programming`,
      "coding education",
      "interactive programming",
      "AI learning",
      "developer skills",
      ...contentKeywords,
      ...courseKeywords.filter((k) => k.length > 3).map((k) => `${k} programming`),
    ],
    ogImage:
      course.image ||
      `/api/og?title=${encodeURIComponent(course.title)}&description=${encodeURIComponent("Interactive Programming Course")}`,
    ogType: "article",
    publishedTime: course.createdAt.toISOString(),
    modifiedTime: (course.updatedAt || course.createdAt).toISOString(),
  })
}

export default async function Page({ params }: CoursePageParams) {
  const { slug } = await params
  const course = await getCourseData(slug)

  if (!course) {
    notFound()
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <JsonLd type="course" data={course} />

      <div className="animate-fade-in">
        <CoursePage course={course} />
      </div>
    </Suspense>
  )
}
