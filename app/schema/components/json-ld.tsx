"use client"

import { usePathname } from "next/navigation"
import {
  type ArticleData,
  type CourseData,
  type FAQItem,
  type HowToStep,
  type QuizData,
  type Schema,
  generateArticleSchema,
  generateBreadcrumbItemsFromPath,
  generateBreadcrumbSchema,
  generateCourseSchema,
  generateFAQSchema,
  generateHowToSchema,
  generatePricingSchema,
  generateQuizSchema,
  generateWebApplicationSchema,
  generateWebsiteSchema,
  getBaseUrl,
  generateOrganizationSchema2,
} from "@/lib/schema"

interface JsonLdProps {
  type?: "default" | "article" | "course" | "quiz" | "faq" | "howTo"
  data?: any
}

export function JsonLd({ type = "default", data }: JsonLdProps) {
  const pathname = usePathname()
  const baseUrl = getBaseUrl()
  const breadcrumbItems = generateBreadcrumbItemsFromPath(pathname)

  const isCoursePage = pathname.includes("/course/") && pathname.split("/").filter(Boolean).length > 1
  const isQuizPage =
    (pathname.includes("/quiz/") || pathname.includes("/quizzes/")) && pathname.split("/").filter(Boolean).length > 1
  const isPricingPage = pathname === "/pricing" || pathname.includes("/subscription")

  try {
    const schemas: Schema[] = []

    // Always include these basic schemas
    schemas.push(generateOrganizationSchema2())
    schemas.push(generateWebsiteSchema())

    // Add breadcrumb schema if available
    if (breadcrumbItems.length > 0) {
      schemas.push(generateBreadcrumbSchema(breadcrumbItems))
    }

    // Handle content-specific schemas
    const lastBreadcrumb = breadcrumbItems[breadcrumbItems.length - 1]
    const defaultUrl = lastBreadcrumb?.url || `${baseUrl}${pathname}`
    const defaultTitle = lastBreadcrumb?.name || "CourseAI Content"

    switch (type) {
    
      case "course":
      case "default":
        if (isCoursePage || type === "course") {
          const courseData = (data as CourseData) || {
            title: defaultTitle,
            description: "Comprehensive programming course with interactive lessons and exercises.",
            createdAt: new Date().toISOString(),
            estimatedHours: 10,
            difficulty: "Beginner to Advanced",
            image: `${baseUrl}/default-course-image.jpg`,
            courseUnits: [
              { title: "Master programming fundamentals" },
              { title: "Build practical coding skills" },
              { title: "Complete hands-on projects" },
            ],
            offers: {
              price: "99.99",
              priceCurrency: "USD",
              url: defaultUrl,
              priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
              availability: "https://schema.org/InStock",
            },
            url: defaultUrl,
            validFrom: new Date().toISOString(),
          }
          schemas.push(generateCourseSchema(courseData))
        }
        break

      case "quiz":
      case "default":
        if (isQuizPage || type === "quiz") {
          const quizData = (data as QuizData) || {
            title: defaultTitle,
            description: "Test your programming knowledge with this interactive quiz.",
            url: defaultUrl,
            dateCreated: new Date().toISOString(),
            author: {
              name: "CourseAI",
              url: baseUrl,
            },
          }
          schemas.push(generateQuizSchema(quizData))
        }
        break

      case "faq":
        if (Array.isArray(data)) {
          const faqItems = data as FAQItem[]
          if (faqItems.length > 0) {
            schemas.push(generateFAQSchema(faqItems))
          }
        }
        break

      case "howTo":
        if (data) {
          const howToData = data as {
            name: string
            description: string
            url: string
            imageUrl: string
            totalTime: string
            steps: HowToStep[]
          }
          if (howToData.name && Array.isArray(howToData.steps)) {
            schemas.push(generateHowToSchema(howToData))
          }
        }
        break
    }

    // Handle special page types
    if (type === "default") {
      if (isPricingPage) {
        schemas.push(generatePricingSchema())
      }

      if (pathname === "/" || pathname === "/home") {
        schemas.push(generateWebApplicationSchema())
      }
    }

    // Remove duplicate schemas
    const uniqueSchemas = schemas.reduce((acc: Schema[], current) => {
      const x = acc.find(item => JSON.stringify(item) === JSON.stringify(current))
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
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "CourseAI",
            url: baseUrl,
          }),
        }}
      />
    )
  }
}