import type { Metadata } from "next"

// Default SEO values
export const defaultSEO = {
  title: "CourseAI: AI-Powered Coding Education Platform",
  description:
    "Master coding with CourseAI's AI-powered MCQs, quizzes, and personalized learning resources. Enhance your programming skills through interactive practice and smart feedback.",
  siteName: "CourseAI",
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io",
  twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE || "@courseai",
  locale: "en_US",
  type: "website",
  keywords: [
    "coding MCQs",
    "programming quizzes",
    "AI learning",
    "coding practice",
    "programming resources",
    "interactive coding",
    "learn to code",
    "coding assessment",
    "programming education",
    "AI-powered learning",
  ],
}

// Interface for generatePageMetadata parameters
export interface PageMetadataProps {
  title: string
  description: string
  path: string
  keywords?: string[]
  ogImage?: string
  ogType?: "website" | "article" | "profile" | "book"
  noIndex?: boolean
  alternateUrls?: Record<string, string>
}

/**
 * Generate consistent metadata for pages
 */
export function generatePageMetadata({
  title,
  description,
  path,
  keywords = [],
  ogImage,
  ogType = "website",
  noIndex = false,
  alternateUrls = {},
}: PageMetadataProps): Metadata {
  const url = new URL(path, defaultSEO.baseUrl).toString()
  const imageUrl = ogImage || `${defaultSEO.baseUrl}/og-image.jpg`

  // Combine default keywords with page-specific keywords
  const combinedKeywords = [...new Set([...defaultSEO.keywords, ...keywords])]

  return {
    title,
    description,
    keywords: combinedKeywords,
    authors: [{ name: process.env.NEXT_PUBLIC_AUTHOR_NAME || "CourseAI Team" }],
    creator: process.env.NEXT_PUBLIC_CREATOR || "CourseAI",
    openGraph: {
      type: ogType,
      locale: defaultSEO.locale,
      url,
      title,
      description,
      siteName: defaultSEO.siteName,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${title} | ${defaultSEO.siteName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: defaultSEO.twitterHandle,
      site: defaultSEO.twitterHandle,
      images: [imageUrl],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    alternates: {
      canonical: url,
      languages: alternateUrls,
    },
  }
}

// Types for schema generators
export type QuizSchemaParams = {
  name: string
  description: string
  url: string
  numberOfQuestions: number
  timeRequired: string
  educationalLevel?: string
}

export type CourseSchemaParams = {
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

export type BreadcrumbItem = {
  name: string
  url: string
}

export type FAQItem = {
  question: string
  answer: string
}

/**
 * Generate Quiz schema
 */
export function generateQuizSchema(params: QuizSchemaParams) {
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

/**
 * Generate Course schema
 */
export function generateCourseSchema(params: CourseSchemaParams) {
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

/**
 * Generate breadcrumb schema
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
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

/**
 * Generate FAQ schema
 */
export function generateFAQSchema(items: FAQItem[]) {
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

