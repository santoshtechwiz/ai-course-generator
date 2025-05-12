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

interface JsonLdProps {
  type?: JsonLdType
  data?: any
}

export function JsonLd({ type = "default", data }: JsonLdProps) {
  const pathname = usePathname()
  const breadcrumbItems = generateBreadcrumbItemsFromPath(pathname)

  const isCoursePage = pathname.includes("/course/") && pathname.split("/").filter(Boolean).length > 1
  const isQuizPage =
    (pathname.includes("/quiz/") || pathname.includes("/quizzes/")) && pathname.split("/").filter(Boolean).length > 1
  const isPricingPage = pathname === "/pricing" || pathname.includes("/subscription")

  try {
    const schemas: Schema[] = []

    // Always include these basic schemas for default type
    if (type === "default") {
      schemas.push(SchemaRegistry.Organization())
      schemas.push(SchemaRegistry.Website())

      // Add breadcrumb schema if available
      if (breadcrumbItems.length > 0) {
        schemas.push(SchemaRegistry.Breadcrumb(breadcrumbItems))
      }

      // Handle special page types
      if (isPricingPage) {
        schemas.push(SchemaRegistry.Pricing())
      }

      if (pathname === "/" || pathname === "/home") {
        schemas.push(SchemaRegistry.WebApplication())
        schemas.push(SchemaRegistry.SoftwareApplication())
      }

      // Handle content-specific schemas based on URL patterns
      if (isCoursePage) {
        const courseData = (data as CourseData) || {
          title: breadcrumbItems[breadcrumbItems.length - 1]?.name || "Programming Course",
          description: "Comprehensive programming course with interactive lessons and exercises.",
          url: pathname,
          createdAt: new Date().toISOString(),
        }
        schemas.push(SchemaRegistry.Course(courseData))
      }

      if (isQuizPage) {
        const quizData = (data as QuizData) || {
          title: breadcrumbItems[breadcrumbItems.length - 1]?.name || "Programming Quiz",
          description: "Test your programming knowledge with this interactive quiz.",
          url: pathname,
          dateCreated: new Date().toISOString(),
        }
        schemas.push(SchemaRegistry.Quiz(quizData))
      }
    } else {
      // Handle specific schema types
      switch (type) {
        case "course":
          schemas.push(SchemaRegistry.Course(data))
          break
        case "quiz":
          schemas.push(SchemaRegistry.Quiz(data))
          break
        case "faq":
          if (Array.isArray(data)) {
            schemas.push(SchemaRegistry.FAQ(data))
          }
          break
        case "howTo":
          schemas.push(SchemaRegistry.HowTo(data))
          break
        case "article":
          schemas.push(SchemaRegistry.Article(data))
          break
        case "person":
          schemas.push(SchemaRegistry.Person(data))
          break
        case "video":
          schemas.push(SchemaRegistry.Video(data))
          break
        case "softwareApplication":
          schemas.push(SchemaRegistry.SoftwareApplication(data))
          break
        case "pricing":
          schemas.push(SchemaRegistry.Pricing(data))
          break
      }
    }

    // Validate schemas before rendering
    const validSchemas = schemas.filter((schema) => validateSchema(schema))

    // Remove duplicate schemas
    const uniqueSchemas = validSchemas.reduce((acc: Schema[], current) => {
      const x = acc.find((item) => JSON.stringify(item) === JSON.stringify(current))
      if (!x) {
        return acc.concat([current])
      } else {
        return acc
      }
    }, [])

    return (
      <>
        {uniqueSchemas.map((schema, index) => (
          <script
            key={`schema-${index}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </>
    )
  } catch (error) {
    console.error("Error generating JSON-LD:", error)
    // Fallback to basic website schema in case of error
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "CourseAI",
            url: process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io",
          }),
        }}
      />
    )
  }
}
