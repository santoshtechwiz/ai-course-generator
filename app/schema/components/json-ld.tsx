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

  // Add page-specific schemas - only add each schema once
  if (type === "article" || (isBlogPost && type !== "course" && type !== "quiz" && type !== "faq" && type !== "howTo")) {
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

  // Only add course schema if explicitly requested or on a course page and no other specific type is requested
  else if (type === "course" || (isCoursePage && type === "default")) {
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

  // Only add quiz schema if explicitly requested or on a quiz page and no other specific type is requested
  else if (type === "quiz" || (isQuizPage && type === "default")) {
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

  // Only add FAQ schema if explicitly requested
  else if (type === "faq") {
    const faqItems = data as FAQItem[]
    if (faqItems && faqItems.length > 0) {
      schemas.push(generateFAQSchema(faqItems))
    }
  }

  // Only add howTo schema if explicitly requested
  else if (type === "howTo") {
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

  // Add pricing schema only on pricing pages and when no specific schema type is requested
  if (isPricingPage && type === "default") {
    schemas.push(generatePricingSchema())
  }

  // Add web application schema only on home page and when no specific schema type is requested
  if ((pathname === "/" || pathname === "/home") && type === "default") {
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
