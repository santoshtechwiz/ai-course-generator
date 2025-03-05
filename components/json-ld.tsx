"use client"

import { usePathname } from "next/navigation"

// Define types for the schema generators
type QuizSchemaParams = {
  name: string
  description: string
  url: string
  numberOfQuestions: number
  timeRequired: string
  educationalLevel?: string
}

type CourseSchemaParams = {
  name: string
  description: string
  provider: string
  url: string
  imageUrl?: string
  instructorName?: string
  instructorUrl?: string
  dateCreated: string
  dateModified?: string
}

type BreadcrumbItem = {
  name: string
  url: string
}

// Schema generator functions
function generateQuizSchema(params: QuizSchemaParams) {
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: params.name,
    description: params.description,
    url: params.url,
    educationalAlignment: {
      "@type": "AlignmentObject",
      educationalFramework: "Programming Skills",
      targetName: "Coding Knowledge Assessment",
      alignmentType: "assesses",
      educationalLevel: params.educationalLevel || "Beginner",
    },
    timeRequired: params.timeRequired,
    numberOfQuestions: params.numberOfQuestions,
    isAccessibleForFree: true,
    provider: {
      "@type": "Organization",
      name: "CourseAI",
      url: new URL("/", params.url).toString(),
    },
  }
}

function generateCourseSchema(params: CourseSchemaParams) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: params.name,
    description: params.description,
    provider: {
      "@type": "Organization",
      name: params.provider,
      url: new URL("/", params.url).toString(),
    },
    url: params.url,
    ...(params.imageUrl && { image: params.imageUrl }),
    inLanguage: "en",
    dateCreated: params.dateCreated,
    ...(params.dateModified && { dateModified: params.dateModified }),
    ...(params.instructorName && {
      instructor: {
        "@type": "Person",
        name: params.instructorName,
        ...(params.instructorUrl && { url: params.instructorUrl }),
      },
    }),
    audience: {
      "@type": "Audience",
      audienceType: "Programmers and coding enthusiasts",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  }
}

function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function JsonLd() {
  const pathname = usePathname()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"
  const currentUrl = `${baseUrl}${pathname}`

  // Organization schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CourseAI",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [
      process.env.NEXT_PUBLIC_TWITTER_URL,
      process.env.NEXT_PUBLIC_FACEBOOK_URL,
      process.env.NEXT_PUBLIC_LINKEDIN_URL,
    ].filter(Boolean),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: process.env.NEXT_PUBLIC_CONTACT_PHONE,
      contactType: "customer service",
      email: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
      availableLanguage: "English",
    },
  }

  // Website schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: baseUrl,
    name: "CourseAI",
    description:
      "An intelligent learning platform for creating and taking coding quizzes, generating programming courses, and enhancing educational experiences.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }

  // Default breadcrumb schema based on current path
  const pathSegments = pathname.split("/").filter(Boolean)
  const breadcrumbItems: BreadcrumbItem[] = [{ name: "Home", url: baseUrl }]

  // Build breadcrumb items based on path segments
  let currentPath = ""
  pathSegments.forEach((segment) => {
    currentPath += `/${segment}`
    const readableName = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    breadcrumbItems.push({
      name: readableName,
      url: `${baseUrl}${currentPath}`,
    })
  })

  const breadcrumbSchemaData = generateBreadcrumbSchema(breadcrumbItems)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchemaData) }} />
    </>
  )
}

// Export the schema generators for use in specific pages
export { generateQuizSchema, generateCourseSchema, generateBreadcrumbSchema }

// Export types for TypeScript support
export type { QuizSchemaParams, CourseSchemaParams, BreadcrumbItem }

