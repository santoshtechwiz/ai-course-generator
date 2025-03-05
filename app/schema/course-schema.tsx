import { generateCourseSchema } from "@/lib/seo-utils"

interface CourseSchemaProps {
  title: string
  description: string
  slug: string
  imageUrl: string
  instructorName: string
  instructorUrl: string
  dateCreated: string
  dateModified?: string
}

export function CourseSchema({
  title,
  description,
  slug,
  imageUrl,
  instructorName,
  instructorUrl,
  dateCreated,
  dateModified,
}: CourseSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"
  const courseUrl = `${baseUrl}/dashboard/course/${slug}`

  const courseSchema = generateCourseSchema({
    name: title,
    description,
    provider: "Course AI",
    url: courseUrl,
    imageUrl,
    instructorName,
    instructorUrl,
    dateCreated,
    dateModified,
  })

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }} />
}

