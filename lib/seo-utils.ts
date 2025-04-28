import type { Metadata } from "next"

interface SeoProps {
  title: string
  description: string
  path: string
  keywords?: string[]
  ogImage?: string
  ogType?: "website" | "article" | "product" | "profile" | "video.other"
  noIndex?: boolean
  canonical?: string
  alternateLanguages?: Record<string, string>
  publishedTime?: string
  modifiedTime?: string
  authors?: Array<{ name: string; url?: string }>
  twitterCard?: "summary" | "summary_large_image" | "app" | "player"
  additionalMetaTags?: Array<{ name: string; content: string }>
}


interface PageMetadataProps {
  title: string
  description: string
  path: string
  keywords?: string[]
  noIndex?: boolean
  ogType?: "website" | "article"
  ogImage?: string
  twitterCard?: "summary" | "summary_large_image"
}

/**
 * Generates standardized metadata for pages with SEO best practices
 */
export function generatePageMetadata({
  title,
  description,
  path,
  keywords = [],
  noIndex = false,
  ogType = "website",
  ogImage,
  twitterCard = "summary_large_image",
}: PageMetadataProps): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"
  const url = `${baseUrl}${path}`
  const defaultImage = `${baseUrl}/api/og?title=${encodeURIComponent(title)}`
  const imageUrl = ogImage || defaultImage

  // Default keywords for the site
  const defaultKeywords = [
    "programming quiz",
    "coding challenge",
    "developer assessment",
    "tech learning",
    "programming practice",
    "coding skills",
    "interactive learning",
  ]

  // Combine default and page-specific keywords, remove duplicates
  const allKeywords = [...new Set([...defaultKeywords, ...keywords])]

  return {
    title: {
      default: title,
      template: `%s | CourseAI`,
    },
    description,
    keywords: allKeywords,
    authors: [{ name: "CourseAI Team" }],
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: url,
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "CourseAI",
      locale: "en_US",
      type: ogType,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: twitterCard,
      title,
      description,
      images: [imageUrl],
      creator: "@courseai",
      site: "@courseai",
    },
    verification: {
      google: "google-site-verification-code", // Replace with your actual verification code
    },
  }
}

/**
 * Generates structured data for quiz pages
 */
export function generateQuizStructuredData({
  title,
  description,
  url,
  questionCount,
  timeRequired,
  author = "CourseAI",
  datePublished,
  dateModified,
  quizType,
}: {
  title: string
  description: string
  url: string
  questionCount: number
  timeRequired: string
  author?: string
  datePublished?: string
  dateModified?: string
  quizType: "mcq" | "openended" | "fill-blanks" | "code" | "flashcard"
}) {
  const quizTypeLabels = {
    mcq: "Multiple Choice",
    openended: "Open-Ended",
    "fill-blanks": "Fill in the Blanks",
    code: "Code Challenge",
    flashcard: "Flashcards",
  }

  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: title,
    description: description,
    educationalAlignment: {
      "@type": "AlignmentObject",
      alignmentType: "educationalSubject",
      targetName: "Computer Science",
    },
    learningResourceType: quizTypeLabels[quizType],
    timeRequired,
    numberOfQuestions: questionCount,
    author: {
      "@type": "Organization",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: "CourseAI",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"}/logo.png`,
      },
    },
    url,
    datePublished: datePublished || new Date().toISOString(),
    dateModified: dateModified || new Date().toISOString(),
    isAccessibleForFree: true,
    educationalUse: "quiz",
  }
}

/**
 * Generates breadcrumb structured data
 */
export function generateBreadcrumbStructuredData(breadcrumbItems: { name: string; href: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.href,
    })),
  }
}

/**
 * Generates FAQ structured data
 */
export function generateFAQStructuredData(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }
}

export const defaultSEO = {
  title: "CourseAI: AI-Powered Coding Question Generator & Learning Platform",
  description:
    "Create custom coding MCQs, quizzes, and flashcards instantly with CourseAI. Our AI generates high-quality programming questions for learning and assessment.",
  siteName: "CourseAI",
  locale: "en_US",
  type: "website",
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io",
  twitterHandle: "@courseai",
  keywords: [
    "ai coding questions",
    "programming mcq generator",
    "coding quiz creator",
    "ai learning platform",
    "programming practice questions",
    "coding assessment tool",
    "learn programming with ai",
    "coding education platform",
    "programming flashcards",
    "developer learning tools",
  ],
}


// Helper function to generate structured data markup for pages
export function generateStructuredData(type: string, data: any): string {
  try {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": type,
      ...data,
    })
  } catch (error) {
    console.error("Error generating structured data:", error)
    return "{}"
  }
}

// Helper function to generate canonical URL
export function generateCanonicalUrl(path: string): string {
  const baseUrl = defaultSEO.baseUrl
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

// Helper function to generate meta description from content
export function generateMetaDescription(content: string, maxLength = 160): string {
  if (!content) return ""

  // Remove HTML tags if present
  const textContent = content.replace(/<[^>]*>/g, "")

  // Truncate to maxLength and add ellipsis if needed
  if (textContent.length <= maxLength) return textContent

  // Try to find a sentence break near the maxLength
  const truncated = textContent.substring(0, maxLength)
  const lastSentenceBreak = Math.max(
    truncated.lastIndexOf(". "),
    truncated.lastIndexOf("! "),
    truncated.lastIndexOf("? "),
  )

  if (lastSentenceBreak > maxLength * 0.7) {
    return textContent.substring(0, lastSentenceBreak + 1)
  }

  // If no good sentence break, find a word break
  const lastWordBreak = truncated.lastIndexOf(" ")
  return textContent.substring(0, lastWordBreak) + "..."
}

// Helper function to extract keywords from content
export function extractKeywords(content: string, maxKeywords = 10): string[] {
  if (!content) return []

  // Remove HTML tags if present
  const textContent = content.replace(/<[^>]*>/g, "")

  // Remove common stop words
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "by",
    "about",
    "against",
    "between",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "from",
    "up",
    "down",
    "of",
    "off",
    "over",
    "under",
    "again",
    "further",
    "then",
    "once",
    "here",
    "there",
    "when",
    "where",
    "why",
    "how",
    "all",
    "any",
    "both",
    "each",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "s",
    "t",
    "can",
    "will",
    "just",
    "don",
    "should",
    "now",
  ])

  // Split into words, filter stop words, and count occurrences
  const words = textContent.toLowerCase().split(/\W+/)
  const wordCounts = words
    .filter((word) => word.length > 3 && !stopWords.has(word))
    .reduce(
      (acc, word) => {
        acc[word] = (acc[word] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

  // Sort by frequency and return top keywords
  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word)
}

