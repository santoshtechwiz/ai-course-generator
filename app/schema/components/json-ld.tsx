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

  // Always include these schemas
  const schemas: Schema[] = [
    generateOrganizationSchema2(),
    generateWebsiteSchema(),
    ...(breadcrumbItems.length > 0 ? [generateBreadcrumbSchema(breadcrumbItems)] : []),
  ]

  // Add page-specific schemas
  if (type === "article" || isBlogPost) {
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
  }

  if (type === "course" || isCoursePage) {
    const courseData = (data as CourseData) || {
      title: breadcrumbItems[breadcrumbItems.length - 1]?.name || "Programming Course",
      description: "Comprehensive programming course with interactive lessons and exercises.",
      createdAt: new Date().toISOString(),
      estimatedHours: 10, // Default 10 hours if not specified
      difficulty: "Beginner to Advanced",
      image: `${baseUrl}/default-course-image.jpg`,
      courseUnits: [
        { title: "Master programming fundamentals" },
        { title: "Build practical coding skills" },
        { title: "Complete hands-on projects" },
      ],
    }
    schemas.push(generateCourseSchema(courseData))
  }

  if (type === "quiz" || isQuizPage) {
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
  }

  if (type === "faq") {
    const faqItems = data as FAQItem[]
    if (faqItems && faqItems.length > 0) {
      schemas.push(generateFAQSchema(faqItems))
    }
  }

  if (type === "howTo") {
    const howToData = data as {
      name: string
      description: string
      url: string
      imageUrl: string
      totalTime: string
      steps: HowToStep[]
    }
    if (howToData) {
      schemas.push(generateHowToSchema(howToData))
    }
  }

  if (isPricingPage) {
    schemas.push(generatePricingSchema())
  }

  if (pathname === "/" || pathname === "/home") {
    schemas.push(generateWebApplicationSchema())
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
}

