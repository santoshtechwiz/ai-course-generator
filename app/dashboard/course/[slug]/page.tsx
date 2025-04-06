import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo-utils"
import { getCourseData } from "@/app/actions/getCourseData"
import CoursePage from "@/components/features/course/CoursePage/CoursePage"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { JsonLd } from "@/app/schema/components/json-ld"


function LoadingSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row w-full min-h-[calc(100vh-4rem)] gap-4 p-4">
      <div className="flex-grow lg:w-3/4">
        <Skeleton className="w-full aspect-video rounded-lg" />
        <Skeleton className="h-[400px] w-full mt-4 rounded-lg" />
      </div>
      <div className="lg:w-1/4 lg:min-w-[300px]">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    </div>
  )
}

// Generate metadata for the course page
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const course = await getCourseData(slug)

  if (!course) {
    return generatePageMetadata({
      title: "Course Not Found | CourseAI",
      description: "The requested programming course could not be found. Explore our other coding education resources.",
      path: `/dashboard/course/${slug}`,
      noIndex: true,
    })
  }

  // Extract keywords from course title and category
  const courseKeywords = course.title.toLowerCase().split(" ")
  const categoryKeyword = course.category?.name?.toLowerCase() || ""

  // Create a more detailed description
  const enhancedDescription =
    course.description ||
    `Master ${course.title} with our interactive coding course. Learn through AI-generated practice questions, hands-on exercises, and expert guidance. Perfect for ${course.difficulty || "all"} level developers.`

  return generatePageMetadata({
    title: `${course.title} Programming Course | Learn with AI`,
    description: enhancedDescription,
    path: `/dashboard/course/${slug}`,
    keywords: [
      `${course.title.toLowerCase()} tutorial`,
      `${course.title.toLowerCase()} programming`,
      `learn ${course.title.toLowerCase()}`,
      `${course.title.toLowerCase()} course`,
      `${categoryKeyword} programming`,
      "coding education",
      "interactive programming",
      "AI learning",
      "developer skills",
      ...courseKeywords.filter((k) => k.length > 3).map((k) => `${k} programming`),
    ],
    ogImage:
      course.image ||
      `/api/og?title=${encodeURIComponent(course.title)}&description=${encodeURIComponent("Interactive Programming Course")}`,
    ogType: "article",
  })
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const course = await getCourseData(slug)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  if (!course) {
    notFound()
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <JsonLd
      type="course"
        data={{
          title: course.title,
          description: course.description || `Learn ${course.title} with interactive lessons and exercises.`,
          image: course.image,
          createdAt: course.createdAt ? new Date(course.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: course.updatedAt ? new Date(course.updatedAt).toISOString() : undefined,
          instructor: course.title
            ? {
                name: course.title || "CourseAI Instructor",
                url: `${baseUrl}/dashboard/instructor/${course.slug}`,
              }
            : undefined,
        }}
      />

      <CoursePage course={course} />
    </Suspense>
  )
}

