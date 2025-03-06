"use client"

import { repeat } from "lodash"
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
  workload?: string
}

type BreadcrumbItem = {
  name: string
  url: string
}

// Schema generator functions
function generateQuizSchema(params: QuizSchemaParams) {
  // Instead of using Quiz type (which isn't well-supported), use LearningResource
  return {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: params.name,
    description: params.description,
    url: params.url,
    learningResourceType: "Quiz",
    educationalAlignment: {
      "@type": "AlignmentObject",
      educationalFramework: "Programming Skills",
      targetName: "Coding Knowledge Assessment",
      alignmentType: "assesses",
      educationalLevel: params.educationalLevel || "Beginner",
    },
    timeRequired: params.timeRequired,
    about: {
      "@type": "Thing",
      name: params.name.replace(" Quiz", ""),
      description: `Knowledge assessment about ${params.name.replace(" Quiz", "")}`,
    },
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
    // Add courseWorkload (required by Google)
    courseWorkload: params.workload || "PT30M", // Default 30 minutes in ISO 8601 duration format
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseSchedule: {
        "@type": "Schedule",
        startDate: new Date(params.dateCreated).toISOString(),
        // 1 year availability
        repeatFrequency: "http://schema.org/Daily", // Available daily
        repeatCount: 365, // Repeat for 1 year
      },
      provider: {
        "@type": "Organization",
        name: params.provider,
        url: new URL("/", params.url).toString(),
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
      validFrom: new Date(params.dateCreated).toISOString(),
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

// Site-wide FAQs
const siteWideFAQs = [
  {
    question: "What is CourseAI?",
    answer:
      "CourseAI is an intelligent learning platform that uses AI to create personalized learning experiences. Our platform offers quiz generation, course creation, flashcards, and other tools to enhance your learning journey.",
  },
  {
    question: "How does CourseAI work?",
    answer:
      "CourseAI uses advanced AI to analyze content and generate quizzes, courses, and learning materials. You can upload documents, provide links, or create content directly on the platform. Our AI then processes this information to create interactive learning experiences tailored to your needs.",
  },
  {
    question: "Is CourseAI free to use?",
    answer:
      "CourseAI offers both free and premium plans. The free plan gives you access to basic features, while our premium subscription unlocks unlimited access to all features, priority support, and advanced AI capabilities.",
  },
  {
    question: "What types of quizzes can I create with CourseAI?",
    answer:
      "CourseAI supports multiple quiz formats including multiple-choice questions, fill-in-the-blanks, coding challenges, and open-ended questions. You can choose the format that best suits your learning objectives.",
  },
  {
    question: "Can I use CourseAI for my classroom or organization?",
    answer:
      "CourseAI is designed for both individual learners and educators. We offer special plans for educational institutions and organizations that need to create learning content at scale.",
  },
  {
    question: "How accurate is the AI-generated content?",
    answer:
      "CourseAI uses state-of-the-art AI models to generate high-quality content. While our AI is highly accurate, we recommend reviewing the generated content before using it in critical educational contexts. We continuously improve our models based on user feedback.",
  },
]

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
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/logo.png`,
      width: 112,
      height: 112,
    },
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
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
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

  // Generate FAQ schema
  const faqSchemaData = generateFAQSchema(siteWideFAQs)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchemaData) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchemaData) }} />
    </>
  )
}

// Export the schema generators for use in specific pages
export { generateQuizSchema, generateCourseSchema, generateBreadcrumbSchema, generateFAQSchema }

// Export types for TypeScript support
export type { QuizSchemaParams, CourseSchemaParams, BreadcrumbItem }

