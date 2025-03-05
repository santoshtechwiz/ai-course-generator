import type { Metadata } from "next"

import { generatePageMetadata } from "@/lib/seo-utils"
import { getCourseData } from "@/app/actions/getCourseData"
import CoursePage from "@/components/features/course/CoursePage/CoursePage"
import CourseStructuredData from "@/components/features/course/CoursePage/CourseStructuredData"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
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
  );
}

// Generate metadata for the course page
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const course = await getCourseData(params.slug)

  if (!course) {
    return {
      title: "Course Not Found",
      description: "The requested course could not be found.",
    }
  }

  return generatePageMetadata({
    title: `${course.name} | Online Course`,
    description:
      course.description ||
      `Learn ${course.name} with our interactive online course. Enhance your skills and knowledge with Course AI.`,
    path: `/dashboard/course/${params.slug}`,
    keywords: [course.name, "online course", "interactive learning", "education", "e-learning"],
    ogImage: course.image || undefined,
    ogType: "article",
  })
}
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug
  const course = await getCourseData(slug)
  if (!course) {
    notFound()
  }
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <CourseStructuredData course={course} />
      <CoursePage course={course} />
    </Suspense>
  )
}

