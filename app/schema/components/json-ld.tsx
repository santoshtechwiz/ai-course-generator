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

  const isBlogPost = pathname.startsWith("/blog/") && pathname.split("/").filter(Boolean).length > 1
  const isCoursePage = pathname.includes("/course/") && pathname.split("/").filter(Boolean).length > 1
  const isQuizPage =
    (pathname.includes("/quiz/") || pathname.includes("/quizzes/")) && pathname.split("/").filter(Boolean).length > 1
  const isPricingPage = pathname === "/pricing" || pathname.includes("/subscription")

  try {
    const schemas: Schema[] = [generateOrganizationSchema2(), generateWebsiteSchema()]
    let contentSchemaAdded = false

    if (breadcrumbItems.length > 0) {
      schemas.push(generateBreadcrumbSchema(breadcrumbItems))
    }

    if (!contentSchemaAdded && (type === "article" || (type === "default" && isBlogPost))) {
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
      contentSchemaAdded = true
    } else if (!contentSchemaAdded && (type === "course" || (type === "default" && isCoursePage))) {
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
      contentSchemaAdded = true
    } else if (!contentSchemaAdded && (type === "quiz" || (type === "default" && isQuizPage))) {
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
      contentSchemaAdded = true
    } else if (!contentSchemaAdded && type === "faq" && Array.isArray(data)) {
      const faqItems = data as FAQItem[]
      if (faqItems.length > 0) {
        schemas.push(generateFAQSchema(faqItems))
        contentSchemaAdded = true
      }
    } else if (!contentSchemaAdded && type === "howTo" && data) {
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
        contentSchemaAdded = true
      }
    }

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
