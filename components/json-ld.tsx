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
    dateCreated: new Date(params.dateCreated).toISOString(),
    ...(params.dateModified && { dateModified: new Date(params.dateModified).toISOString() }),
    ...(params.instructorName && {
      instructor: {
        "@type": "Person",
        name: params.instructorName,
        ...(params.instructorUrl && { url: params.instructorUrl }),
      },
    }),
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseWorkload: "P2D",
      courseMode: "online",
      provider: {
        "@type": "Organization",
        name: params.provider,
        url: new URL("/", params.url).toString(),
      },
      courseSchedule: {
        "@type": "Schedule",
        duration: "PT3H",
        repeatFrequency: "Daily",
        repeatCount: 31,
        startDate: "2024-07-01",
        endDate: "2024-07-31"
      },
    },
    audience: {
      "@type": "Audience",
      audienceType: "Programmers and coding enthusiasts",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      category: "free",
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

function generateFAQSchema(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }
}

function generateOrganizationSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CourseAI",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [
      "https://twitter.com/courseai",
      "https://facebook.com/courseai",
      "https://linkedin.com/company/courseai",
    ].filter(Boolean),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+1-800-123-4567",
      contactType: "customer service",
      email: process.env.NEXT_PUBLIC_CONTACT_EMAIL||"webmaster.codeguru@gmail.com" ,
      availableLanguage: "English",
    },
  }
}

function generateWebsiteSchema(baseUrl: string) {
  return {
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
}

function generatePricingSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "CourseAI",
    description: "AI-powered platform for creating courses, quizzes, and educational content",
    image: `${baseUrl}/images/courseai-logo.png`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "0",
      highPrice: "49.99",
      offerCount: "3",
      offers: [
        {
          "@type": "Offer",
          name: "Free Trial",
          price: "0",
          priceCurrency: "USD",
          description: "3 Day Free Trial with limited features",
          url: `${baseUrl}/pricing#free-trial`,
        },
        {
          "@type": "Offer",
          name: "Basic Plan",
          price: "19.99",
          priceCurrency: "USD",
          description: "25 Hosted Courses",
          url: `${baseUrl}/pricing#basic`,
        },
        {
          "@type": "Offer",
          name: "Premium Plan",
          price: "49.99",
          priceCurrency: "USD",
          description: "Unlimited courses and premium features",
          url: `${baseUrl}/pricing#premium`,
        },
      ],
    },
  }
}

function generateWebApplicationSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "CourseAI Quiz Generator",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    description: "AI-powered platform for creating quizzes, assessments, and educational content instantly",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "AI Quiz Generation",
      "Multiple Choice Questions",
      "True/False Questions",
      "Open-Ended Questions",
      "Video Quiz Creation",
      "PDF Quiz Generation",
      "Custom Templates",
      "Analytics Dashboard",
      "Automated Grading",
      "Question Bank",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1000",
      bestRating: "5",
      worstRating: "1",
    },
    provider: {
      "@type": "Organization",
      name: "CourseAI",
      url: baseUrl,
    },
    screenshot: `${baseUrl}/images/courseai-screenshot.png`,
    softwareVersion: "2.0",
    url: baseUrl,
  }
}

export function JsonLd() {
  const pathname = usePathname()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

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

  return (
    <>
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify(generateOrganizationSchema(baseUrl)) 
        }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify(generateWebsiteSchema(baseUrl)) 
        }} 
      />
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify(generateBreadcrumbSchema(breadcrumbItems)) 
        }} 
      />
      {pathname === "/pricing" && (
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ 
            __html: JSON.stringify(generatePricingSchema(baseUrl)) 
          }} 
        />
      )}
      {(pathname === "/" || pathname === "/home") && (
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ 
            __html: JSON.stringify(generateWebApplicationSchema(baseUrl)) 
          }} 
        />
      )}
    </>
  )
}

// Export the schema generators for use in specific pages
export { 
  generateQuizSchema, 
  generateCourseSchema, 
  generateBreadcrumbSchema, 
  generateFAQSchema,
  generateOrganizationSchema,
  generateWebsiteSchema,
  generatePricingSchema,
  generateWebApplicationSchema
}

// Export types for TypeScript support
export type { QuizSchemaParams, CourseSchemaParams, BreadcrumbItem }