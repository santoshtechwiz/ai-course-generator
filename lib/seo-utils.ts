import type { Metadata } from "next"

interface SeoProps {
  title: string
  description: string
  path: string
  keywords?: string[]
  ogImage?: string
  ogType?: "website" | "article"
  noIndex?: boolean
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

export function generatePageMetadata({
  title,
  description,
  path,
  keywords = [],
  ogImage,
  ogType = "website",
  noIndex = false,
}: SeoProps): Metadata {
  const url = `${defaultSEO.baseUrl}${path}`
  const imageUrl = ogImage || `${defaultSEO.baseUrl}/og-image.jpg`

  // Combine default keywords with page-specific keywords
  const combinedKeywords = [...new Set([...defaultSEO.keywords, ...keywords])]

  return {
    title,
    description,
    keywords: combinedKeywords,
    authors: [
      {
        name: process.env.NEXT_PUBLIC_AUTHOR_NAME || "CourseAI Team",
        url: process.env.NEXT_PUBLIC_AUTHOR_URL,
      },
    ],
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
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: defaultSEO.twitterHandle,
      images: [imageUrl],
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: url,
    },
    metadataBase: new URL(defaultSEO.baseUrl),
  }
}

