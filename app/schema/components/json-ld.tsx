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

  // Determine page type based on pathname if not explicitly provided
  const isBlogPost = pathname.startsWith("/blog/") && pathname.split("/").filter(Boolean).length > 1
  const isCoursePage = pathname.includes("/course/") && pathname.split("/").filter(Boolean).length > 1
  const isQuizPage =
    (pathname.includes("/quiz/") || pathname.includes("/quizzes/")) && pathname.split("/").filter(Boolean).length > 1
  const isPricingPage = pathname === "/pricing" || pathname.includes("/subscription")

  try {
    // Always include these schemas
    const schemas: Schema[] = [generateOrganizationSchema2(), generateWebsiteSchema()]

    // Only add breadcrumb if we have items
    if (breadcrumbItems.length > 0) {
      schemas.push(generateBreadcrumbSchema(breadcrumbItems))
    }

    // Determine which specific schema to add based on type prop
    // Only add ONE content-specific schema
    if (type === "article" || (type === "default" && isBlogPost)) {
      const articleData = (data as ArticleData) || {
        headline: `CourseAI - ${breadcrumbItems[breadcrumbItems.length - 1]?.name || "Article"}`,
        description: "Learn programming concepts with CourseAI's comprehensive guides.",
        url: breadcrumbItems[breadcrumbItems.length - 1]?.url || baseUrl,
        imageUrl: `${baseUrl}/images/default-article.jpg`,
        datePublished: new Date().toISOString(),
        authorName: "CourseAI Team",
        publisherName: "CourseAI",
        publisherLogoUrl: `${baseUrl}/logo.png`,
      }
      schemas.push(generateArticleSchema(articleData))
    } else if (type === "course" || (type === "default" && isCoursePage)) {
      const courseData = (data as CourseData) || {
        title: breadcrumbItems[breadcrumbItems.length - 1]?.name || "Programming Course",
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
        price: "99.99",
        currency: "USD",
        url: `${baseUrl}${pathname}`,
        validFrom: new Date().toISOString(),
      }
      schemas.push(generateCourseSchema(courseData))
    } else if (type === "quiz" || (type === "default" && isQuizPage)) {
      const quizData = (data as QuizData) || {
        title: breadcrumbItems[breadcrumbItems.length - 1]?.name || "Programming Quiz",
        description: "Test your programming knowledge with this interactive quiz.",
        url: breadcrumbItems[breadcrumbItems.length - 1]?.url || `${baseUrl}${pathname}`,
        dateCreated: new Date().toISOString(),
        author: {
          name: "CourseAI",
          url: baseUrl,
        },
      }
      schemas.push(generateQuizSchema(quizData))
    } else if (type === "faq" && Array.isArray(data)) {
      const faqItems = data as FAQItem[]
      if (faqItems && faqItems.length > 0) {
        schemas.push(generateFAQSchema(faqItems))
      }
    } else if (type === "howTo" && data) {
      const howToData = data as {
        name: string
        description: string
        url: string
        imageUrl: string
        totalTime: string
        steps: HowToStep[]
      }
      if (howToData.name && howToData.steps && Array.isArray(howToData.steps)) {
        schemas.push(generateHowToSchema(howToData))
      }
    }

    // Add page-specific schemas only when no specific content type is requested
    if (type === "default") {
      if (isPricingPage) {
        schemas.push(generatePricingSchema())
      }

      if (pathname === "/" || pathname === "/home") {
        schemas.push(generateWebApplicationSchema())
      }
    }

    return (
      <>
        {schemas.map((schema, index) => (
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
    // Return minimal valid schema to prevent rendering errors
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

