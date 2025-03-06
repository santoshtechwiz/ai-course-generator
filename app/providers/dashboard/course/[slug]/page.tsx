import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo-utils"
import { getCourseData } from "@/app/actions/getCourseData"
import CoursePage from "@/components/features/course/CoursePage/CoursePage"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import CourseSchema from "@/app/schema/course-schema"
import { BreadcrumbJsonLd } from "@/app/schema/breadcrumb-schema"

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
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const course = await getCourseData(params.slug)

  if (!course) {
    return generatePageMetadata({
      title: "Course Not Found | CourseAI",
      description: "The requested programming course could not be found. Explore our other coding education resources.",
      path: `/dashboard/course/${params.slug}`,
      noIndex: true,
    })
  }

  return generatePageMetadata({
    title: `${course.name} | Programming Course`,
    description:
      course.description ||
      `Master ${course.name} with our interactive coding course. Enhance your programming skills with hands-on practice and expert guidance.`,
    path: `/dashboard/course/${params.slug}`,
    keywords: [
      `${course.name.toLowerCase()} tutorial`,
      `${course.name.toLowerCase()} programming`,
      "coding education",
      "interactive programming",
      "developer learning",
    ],
    ogImage: course.image || undefined,
    ogType: "article",
  })
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug
  const course = await getCourseData(slug)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"

  if (!course) {
    notFound()
  }

  // Create breadcrumb items
  const breadcrumbItems = [
    { name: "Home", url: baseUrl },
    { name: "Dashboard", url: `${baseUrl}/dashboard` },
    { name: "Courses", url: `${baseUrl}/dashboard/explore` },
    { name: course.name, url: `${baseUrl}/dashboard/course/${slug}` },
  ]

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CourseSchema
        course={{
          name: course.name,
          description: course.description || `Learn ${course.name} with interactive lessons and exercises.`,
          image: course.image,
          createdAt: course.createdAt ? new Date(course.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: course.updatedAt ? new Date(course.updatedAt).toISOString() : undefined,
          instructor: course.name
            ? {
                name: course.name || "CourseAI Instructor",
                url: `${baseUrl}/dashboard/instructor/${course.slug}`,
              }
            : undefined,
        }}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <CoursePage course={course} />
    </Suspense>
  )
}

