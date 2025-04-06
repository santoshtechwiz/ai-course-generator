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
  const isCoursePage = pathname.startsWith("/courses/") && pathname.split("/").filter(Boolean).length > 1
  const isPricingPage = pathname === "/pricing"

  // Always include these schemas
  const schemas: Schema[] = [
   
    ...(breadcrumbItems.length > 0 ? [generateBreadcrumbSchema(breadcrumbItems)] : []),
    generateOrganizationSchema2(),
    generateWebsiteSchema(),
    generateBreadcrumbSchema(breadcrumbItems),
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
      description: "Comprehensive programming course with interactive lessons.",
      createdAt: new Date().toISOString(),
      url: breadcrumbItems[breadcrumbItems.length - 1]?.url,
    }
    schemas.push(generateCourseSchema(courseData))
  }

  if (type === "quiz") {
    const quizData = data as QuizData
    if (quizData) {
      schemas.push(generateQuizSchema(quizData))
    }
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

