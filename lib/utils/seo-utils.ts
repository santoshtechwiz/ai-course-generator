import type { Metadata } from "next"

/**
 * Interface for SEO metadata options
 */
interface SeoOptions {
  title: string
  description: string
  keywords?: string[]
  image?: string
  type?: "website" | "article" | "profile" | "course"
  publishedAt?: string
  updatedAt?: string
  author?: string
  noIndex?: boolean
}

/**
 * Generate consistent metadata for SEO
 * @param options SEO options
 * @returns Metadata object for Next.js
 */
export function generateSeoMetadata(options: SeoOptions): Metadata {
  const {
    title,
    description,
    keywords = [],
    image,
    type = "website",
    publishedAt,
    updatedAt,
    author,
    noIndex = false,
  } = options

  const websiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.app"
  const defaultImage = `${websiteUrl}/api/og?title=${encodeURIComponent(title)}`
  const imageUrl = image || defaultImage

  return {
    title,
    description,
    keywords: keywords.join(", "),
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      type,
      url: websiteUrl,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${title} | Course AI`,
        },
      ],
      siteName: "Course AI",
      publishedTime: publishedAt,
      modifiedTime: updatedAt,
      authors: author ? [author] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      creator: "@courseai",
    },
    alternates: {
      canonical: websiteUrl,
    },
  }
}

/**
 * Generate structured data for courses
 * @param course Course data
 * @returns JSON-LD structured data
 */
export function generateCourseStructuredData(course: any) {
  const websiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.app"

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    provider: {
      "@type": "Organization",
      name: "Course AI",
      sameAs: websiteUrl,
    },
    url: `${websiteUrl}/dashboard/course/${course.slug}`,
    ...(course.image && { image: course.image }),
    ...(course.difficulty && {
      educationalLevel: course.difficulty,
    }),
    ...(course.estimatedHours && {
      timeRequired: `PT${course.estimatedHours}H`,
    }),
    ...(course.category?.name && {
      about: {
        "@type": "Thing",
        name: course.category.name,
      },
    }),
  }
}

/**
 * Generate structured data for quizzes
 * @param quiz Quiz data
 * @returns JSON-LD structured data
 */
export function generateQuizStructuredData(quiz: any) {
  const websiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.app"

  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: quiz.title,
    url: `${websiteUrl}/dashboard/${quiz.quizType}/${quiz.slug}`,
    educationalUse: "Assessment",
    ...(quiz.questions?.length && {
      numberOfQuestions: quiz.questions.length,
    }),
  }
}
