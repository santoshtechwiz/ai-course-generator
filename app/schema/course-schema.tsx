"use client"

import { generateCourseSchema } from "@/components/json-ld"

interface CourseSchemaProps {
  course: {
    name: string
    description: string
    image?: string
    createdAt: string
    updatedAt?: string
    instructor?: {
      name: string
      url?: string
    }
  }
}

export default function CourseSchema({ course }: CourseSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"
  const courseUrl = `${baseUrl}/dashboard/course/${course.name.toLowerCase().replace(/\s+/g, "-")}`

  const courseSchema = generateCourseSchema({
    name: course.name,
    description: course.description || `Learn ${course.name} with interactive lessons and exercises.`,
    provider: "CourseAI",
    url: courseUrl,
    imageUrl: course.image,
    instructorName: course.instructor?.name,
    instructorUrl: course.instructor?.url,
    dateCreated: course.createdAt,
    dateModified: course.updatedAt,
  })

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }} />
}

