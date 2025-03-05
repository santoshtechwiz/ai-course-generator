
import { CourseJsonLd } from "@/app/schema/course-schema"
import type { Course } from "@/app/types/types"

interface CourseStructuredDataProps {
  course: Course
}

export default function CourseStructuredData({ course }: CourseStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"

  return (
    <CourseJsonLd
      courseDetails={{
        name: course.name,
        description: course.description || `Learn ${course.name} with our interactive course`,
        provider: "CourseAI",
        url: `${baseUrl}/dashboard/course/${course.slug}`,
        imageUrl: course.image,
        instructorName: "CourseAI Instructor",
        instructorUrl: baseUrl,
        dateCreated: course.createdAt.toISOString(),
      }}
    />
  )
}

