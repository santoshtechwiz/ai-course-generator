"use client"

import { usePathname } from "next/navigation"
import {
  type CourseData,
  type QuizData,
  type Schema,
  SchemaRegistry,
  generateBreadcrumbItemsFromPath,
  validateSchema,
} from "@/lib/schema"

export type JsonLdType =
  | "default"
  | "article"
  | "course"
  | "quiz"
  | "faq"
  | "howTo"
  | "person"
  | "video"
  | "softwareApplication"
  | "pricing"

// Define a comprehensive props type that includes all possible schema types
interface JsonLdProps {
  type: JsonLdType
  data: any
  // We could make this more type-safe by using a discriminated union,
  // but that would require changing all usages of the component
}

export function JsonLd({ type, data }: JsonLdProps) {
  if (type === "course") {
    // Add proper type validation for course data
    const courseSchema = {
      "@context": "https://schema.org/",
      "@type": "Course",
      name: data?.title || "Untitled Course",
      description: data?.description || "No description provided",
      provider: {
        "@type": "Organization",
        name: "CourseAI",
        sameAs: "https://courseai.io/",
      },
      // Add additional course properties if available
      ...(data?.image && { image: data.image }),
      ...(data?.url && { url: data.url }),
      ...(data?.courseCode && { courseCode: data.courseCode }),
      ...(data?.hasCourseInstance && { hasCourseInstance: data.hasCourseInstance }),
      ...(data?.instructor && {
        instructor: Array.isArray(data.instructor)
          ? data.instructor.map((i: any) => ({ "@type": "Person", name: i.name }))
          : { "@type": "Person", name: data.instructor }
      })
    }

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }}
      />
    )
  }

  // Add support for other schema types as needed
  return null
}
