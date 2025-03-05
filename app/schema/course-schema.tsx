import { CourseSchemaParams } from "@/components/json-ld"
import { generateCourseSchema } from "@/lib/seo-utils"

interface CourseJsonLdProps {
  courseDetails: CourseSchemaParams
}

export function CourseJsonLd({ courseDetails }: CourseJsonLdProps) {
  const courseSchema = generateCourseSchema(courseDetails)

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }} />
}

