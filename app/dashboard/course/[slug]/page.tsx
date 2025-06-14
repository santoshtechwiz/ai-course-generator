import type { Metadata } from "next"
import { generateCourseMetadata } from "@/lib/seo"
import { getCourseData } from "@/app/actions/getCourseData"
import { JsonLD } from "@/app/schema/components"
import { notFound } from "next/navigation"
import type { FullCourseType } from "@/app/types/types"
import EnhancedCourseLayout from "./components/EnhancedCourseLayout"

type CoursePageParams = {
  params: Promise<{ slug: string }>
}

// Generate metadata for the course page with improved typing
export async function generateMetadata({ params }: CoursePageParams): Promise<Metadata> {
  const { slug } = await params
  const course = (await getCourseData(slug)) as FullCourseType | null
  return generateCourseMetadata(course, slug)
}

export default async function Page({ params }: CoursePageParams) {
  const { slug } = await params
  const course = await getCourseData(slug)

  if (!course) {
    notFound()
  }

  return (
    <>
      <JsonLD
        type="Course"
        data={{
          name: course.title,
          description: course.description,
          provider: {
            "@type": "Organization",
            name: "AI Learning Platform",
            sameAs: process.env.NEXT_PUBLIC_BASE_URL || "https://example.com"
          },
          audience: {
            "@type": "Audience",
            audienceType: course.difficulty || "All Levels"
          },
          educationalLevel: course.difficulty,
          teaches: course.title,
          inLanguage: "en",
          dateCreated: course.createdAt,
          dateModified: course.updatedAt,
          timeRequired: `PT${course.estimatedTime || 5}H`,
          image: course.image || `/api/og?title=${encodeURIComponent(course.title)}`,
          about: course.category?.name || "",
          learningResourceType: "Course",
          courseCode: course.slug
        }}
      />

      <EnhancedCourseLayout 
        course={course} 
        breadcrumbs={[
          { label: course.category?.name || "Category", href: `/dashboard/category/${course.category?.slug || ""}` }
        ]}
      />
    </>
  )
}
