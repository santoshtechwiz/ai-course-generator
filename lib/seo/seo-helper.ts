/**
 * Enhanced SEO utility functions
 * Comprehensive helpers for SEO optimization and content processing
 */

import type { Metadata } from "next"
import { BASE_URL, defaultSiteInfo, SEO_CONFIG } from "./constants"
import { BreadcrumbItem, MetadataOptions } from "./seo-schema"
import { metadataGenerator } from "./metadata-generator"


// ============================================================================
// CONTENT OPTIMIZATION UTILITIES
// ============================================================================

/**
 * Extracts SEO-friendly keywords from content with advanced filtering
 */
export function extractKeywords(content: string, limit = 10): string[] {
  const stopwords = new Set([
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
    "of",
    "that",
    "this",
    "these",
    "those",
    "it",
    "its",
    "they",
    "them",
    "their",
    "there",
    "where",
    "when",
    "why",
    "how",
    "what",
    "which",
    "who",
    "whom",
    "whose",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "can",
    "must",
    "shall",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "get",
    "got",
    "go",
    "goes",
    "went",
    "come",
    "came",
    "see",
    "saw",
    "know",
    "knew",
    "think",
    "thought",
    "say",
    "said",
    "tell",
    "told",
    "ask",
    "asked",
    "give",
    "gave",
    "take",
    "took",
    "make",
    "made",
    "use",
    "used",
    "find",
    "found",
    "work",
    "worked",
    "call",
    "called",
    "try",
    "tried",
    "need",
    "needed",
    "feel",
    "felt",
    "become",
    "became",
    "leave",
    "left",
    "put",
    "puts",
    "mean",
    "means",
    "keep",
    "kept",
    "let",
    "lets",
    "begin",
    "began",
    "seem",
    "seemed",
    "help",
    "helped",
    "talk",
    "talked",
    "turn",
    "turned",
    "start",
    "started",
    "show",
    "showed",
    "hear",
    "heard",
    "play",
    "played",
    "run",
    "ran",
    "move",
    "moved",
    "live",
    "lived",
    "believe",
    "believed",
    "hold",
    "held",
    "bring",
    "brought",
    "happen",
    "happened",
    "write",
    "wrote",
    "provide",
    "provided",
    "sit",
    "sat",
    "stand",
    "stood",
    "lose",
    "lost",
    "pay",
    "paid",
    "meet",
    "met",
    "include",
    "included",
    "continue",
    "continued",
    "set",
    "sets",
    "learn",
    "learned",
    "change",
    "changed",
    "lead",
    "led",
    "understand",
    "understood",
    "watch",
    "watched",
    "follow",
    "followed",
    "stop",
    "stopped",
    "create",
    "created",
    "speak",
    "spoke",
    "read",
    "reads",
    "allow",
    "allowed",
    "add",
    "added",
    "spend",
    "spent",
    "grow",
    "grew",
    "open",
    "opened",
    "walk",
    "walked",
    "win",
    "won",
    "offer",
    "offered",
    "remember",
    "remembered",
    "love",
    "loved",
    "consider",
    "considered",
    "appear",
    "appeared",
    "buy",
    "bought",
    "wait",
    "waited",
    "serve",
    "served",
    "die",
    "died",
    "send",
    "sent",
    "expect",
    "expected",
    "build",
    "built",
    "stay",
    "stayed",
    "fall",
    "fell",
    "cut",
    "cuts",
    "reach",
    "reached",
    "kill",
    "killed",
    "remain",
    "remained",
  ])

  // Enhanced text processing
  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Replace punctuation with spaces
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
    .split(" ")
    .filter(
      (word) =>
        word.length > 2 &&
        word.length < 20 && // Avoid very long words
        !stopwords.has(word) &&
        isNaN(Number(word)) && // Exclude numbers
        !/^\d/.test(word) && // Exclude words starting with digits
        /^[a-zA-Z]/.test(word), // Must start with letter
    )

  // Calculate word frequency with position weighting
  const wordFrequency: Record<string, number> = {}
  words.forEach((word, index) => {
    const positionWeight = index < words.length * 0.1 ? 2 : 1 // Higher weight for early words
    wordFrequency[word] = (wordFrequency[word] || 0) + positionWeight
  })

  // Return top keywords sorted by frequency
  return Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map((entry) => entry[0])
}

/**
 * Generates optimized meta descriptions with smart truncation
 */
export function generateMetaDescription(content: string, maxLength = 160): string {
  if (!content || content.length === 0) return ""

  // Clean HTML and normalize whitespace
  const cleanContent = content
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/[^\w\s.,!?;:-]/g, "") // Remove special characters except basic punctuation
    .trim()

  if (cleanContent.length <= maxLength) return cleanContent

  // Smart truncation at sentence boundaries
  const sentences = cleanContent.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  let description = ""

  for (const sentence of sentences) {
    const potentialDesc = description + (description ? ". " : "") + sentence.trim()
    if (potentialDesc.length <= maxLength - 3) {
      description = potentialDesc
    } else {
      break
    }
  }

  // If no complete sentences fit, truncate at word boundary
  if (!description) {
    const truncateIndices = [
      cleanContent.lastIndexOf(". ", maxLength - 3),
      cleanContent.lastIndexOf("? ", maxLength - 3),
      cleanContent.lastIndexOf("! ", maxLength - 3),
      cleanContent.lastIndexOf(", ", maxLength - 3),
      cleanContent.lastIndexOf(" ", maxLength - 3),
    ].filter((index) => index > maxLength * 0.5) // Ensure we don't truncate too early

    const truncateIndex = truncateIndices.length > 0 ? Math.max(...truncateIndices) + 1 : maxLength - 3

    description = cleanContent.substring(0, truncateIndex)
  }

  return description + (description.length < cleanContent.length ? "..." : "")
}

/**
 * Optimizes image alt text for better accessibility and SEO
 */
export function optimizeImageAlt(alt: string | undefined | null, fallback: string): string {
  if (!alt) return fallback

  return alt
    .trim()
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/^(image|picture|photo|screenshot|graphic|illustration) of /i, "") // Remove redundant prefixes
    .replace(/^(showing|displaying|depicting|featuring) /i, "") // Remove redundant verbs
    .replace(/\.(jpg|jpeg|png|gif|webp|svg)$/i, "") // Remove file extensions
    .substring(0, 125) // Limit length for screen readers
    .trim()
}

// ============================================================================
// STRUCTURED DATA UTILITIES
// ============================================================================

/**
 * Generates JSON-LD structured data with validation
 */
export function generateJsonLd(type: string, data: Record<string, any>): Record<string, any> {
  const schema = {
    "@context": "https://schema.org",
    "@type": type.charAt(0).toUpperCase() + type.slice(1),
    ...data,
  }

  // Remove undefined values
  return JSON.parse(JSON.stringify(schema))
}

/**
 * Creates optimized social media image URLs
 */
export function getSocialImageUrl(
  title: string,
  description?: string,
  imagePath?: string,
  width = 1200,
  height = 630,
): string {
  if (imagePath?.startsWith("http")) {
    return imagePath
  } else if (imagePath) {
    return `${BASE_URL}${imagePath.startsWith("/") ? imagePath : "/" + imagePath}`
  }

  // Generate dynamic OG image
  const params = new URLSearchParams({
    title: title.substring(0, 100),
    width: width.toString(),
    height: height.toString(),
  })

  if (description) {
    params.set("description", description.substring(0, 200))
  }

  return `${BASE_URL}/api/og?${params.toString()}`
}

// ============================================================================
// BREADCRUMB UTILITIES
// ============================================================================

/**
 * Creates breadcrumb items from path segments
 */
export function createBreadcrumbItems(
  paths: { name: string; path: string }[],
  baseUrl: string = BASE_URL,
): BreadcrumbItem[] {
  return paths.map((item, index) => ({
    position: index + 1,
    name: item.name,
    url: item.path.startsWith("http")
      ? item.path
      : `${baseUrl}${item.path.startsWith("/") ? item.path : "/" + item.path}`,
  }))
}

/**
 * Automatically generates breadcrumbs from current path
 */
export function generateBreadcrumbs(
  currentPath: string,
  siteUrl: string = BASE_URL,
  customLabels: Record<string, string> = {},
): BreadcrumbItem[] {
  const cleanPath = currentPath.replace(/^\/+|\/+$/g, "")
  if (!cleanPath) {
    return [{ position: 1, name: "Home", url: siteUrl }]
  }

  const segments = cleanPath.split("/")
  const breadcrumbs: BreadcrumbItem[] = [{ position: 1, name: "Home", url: siteUrl }]

  let currentUrl = siteUrl
  segments.forEach((segment, index) => {
    currentUrl += `/${segment}`
    const name =
      customLabels[segment] ||
      segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

    breadcrumbs.push({
      position: index + 2,
      name,
      url: currentUrl,
    })
  })

  return breadcrumbs
}

// ============================================================================
// SOCIAL MEDIA UTILITIES
// ============================================================================

/**
 * Creates social media profile URLs from handles
 */
export function createSocialProfiles(profiles: {
  twitter?: string
  facebook?: string
  linkedin?: string
  github?: string
  youtube?: string
  instagram?: string
  tiktok?: string
  discord?: string
}): string[] {
  const socialProfiles: string[] = []

  if (profiles.twitter) {
    socialProfiles.push(`https://twitter.com/${profiles.twitter.replace("@", "")}`)
  }
  if (profiles.facebook) {
    socialProfiles.push(`https://facebook.com/${profiles.facebook}`)
  }
  if (profiles.linkedin) {
    socialProfiles.push(`https://linkedin.com/company/${profiles.linkedin}`)
  }
  if (profiles.github) {
    socialProfiles.push(`https://github.com/${profiles.github}`)
  }
  if (profiles.youtube) {
    socialProfiles.push(`https://youtube.com/c/${profiles.youtube}`)
  }
  if (profiles.instagram) {
    socialProfiles.push(`https://instagram.com/${profiles.instagram}`)
  }
  if (profiles.tiktok) {
    socialProfiles.push(`https://tiktok.com/@${profiles.tiktok}`)
  }
  if (profiles.discord) {
    socialProfiles.push(`https://discord.gg/${profiles.discord}`)
  }

  return socialProfiles
}

// ============================================================================
// CONTENT TYPE UTILITIES
// ============================================================================

/**
 * Gets human-readable label for quiz types
 */
export function getQuizTypeLabel(quizType?: string): string {
  const typeMap: Record<string, string> = {
    mcq: "Multiple Choice",
    "multiple-choice": "Multiple Choice",
    open: "Open-Ended",
    "open-ended": "Open-Ended",
    "fill-in-blank": "Fill-in-the-Blank",
    fillinblank: "Fill-in-the-Blank",
    coding: "Coding Challenge",
    "true-false": "True/False",
    matching: "Matching",
    ordering: "Ordering",
    "drag-drop": "Drag & Drop",
  }

  return typeMap[quizType?.toLowerCase() || ""] || quizType || "Practice Quiz"
}

/**
 * Gets human-readable label for course difficulty
 */
export function getCourseDifficultyLabel(difficulty?: string): string {
  const difficultyMap: Record<string, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    expert: "Expert",
    "all-levels": "All Levels",
  }

  return difficultyMap[difficulty?.toLowerCase() || ""] || difficulty || "All Levels"
}

// ============================================================================
// METADATA GENERATION
// ============================================================================

/**
 * Main metadata generation function with comprehensive options
 */
export function generateMetadata(options: MetadataOptions): Metadata {
  return metadataGenerator.generateMetadata(options)
}

/**
 * Generates course-specific structured data
 */
export function generateCourseStructuredData(course: {
  title: string
  description?: string
  slug: string
  image?: string
  difficulty?: string
  estimatedHours?: number
  category?: { name: string }
  price?: number
  priceCurrency?: string
  offers?: any[]
  hasCourseInstance?: any[]
  author?: string
  dateCreated?: string
  dateModified?: string
}) {
  const websiteUrl = BASE_URL

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description || SEO_CONFIG.defaultDescription,
    provider: {
      "@type": "Organization",
      name: defaultSiteInfo.name,
      sameAs: websiteUrl,
    },
    url: `${websiteUrl}/dashboard/course/${course.slug}`,
    image: course.image || getSocialImageUrl(course.title),
    educationalLevel: getCourseDifficultyLabel(course.difficulty),
    timeRequired: course.estimatedHours ? `PT${course.estimatedHours}H` : undefined,
    about: course.category?.name
      ? {
          "@type": "Thing",
          name: course.category.name,
        }
      : undefined,
    offers:
      course.offers ||
      (course.price !== undefined
        ? [
            {
              "@type": "Offer",
              url: `${websiteUrl}/dashboard/course/${course.slug}`,
              price: course.price,
              priceCurrency: course.priceCurrency || "USD",
              availability: "https://schema.org/InStock",
            },
          ]
        : []),
    hasCourseInstance: course.hasCourseInstance || [],
    author: course.author
      ? {
          "@type": "Person",
          name: course.author,
        }
      : undefined,
    dateCreated: course.dateCreated,
    dateModified: course.dateModified,
    inLanguage: "en-US",
    learningResourceType: "Course",
    educationalUse: "instruction",
  }
}

/**
 * Generates quiz-specific structured data
 */
export function generateQuizStructuredData(quiz: {
  title: string
  description?: string
  slug: string
  quizType?: string
  questions?: any[]
  image?: string
  author?: string
  createdAt?: string
  updatedAt?: string
  difficulty?: string
  estimatedTime?: number
}) {
  const websiteUrl = BASE_URL

  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: quiz.title,
    description: quiz.description || SEO_CONFIG.defaultDescription,
    url: `${websiteUrl}/dashboard/${quiz.quizType || "quiz"}/${quiz.slug}`,
    educationalUse: "assessment",
    learningResourceType: getQuizTypeLabel(quiz.quizType),
    numberOfQuestions: quiz.questions?.length || 0,
    creator: quiz.author
      ? {
          "@type": "Person",
          name: quiz.author,
        }
      : undefined,
    dateCreated: quiz.createdAt,
    dateModified: quiz.updatedAt,
    image: quiz.image || getSocialImageUrl(quiz.title),
    educationalLevel: getCourseDifficultyLabel(quiz.difficulty),
    timeRequired: quiz.estimatedTime ? `PT${quiz.estimatedTime}M` : undefined,
    inLanguage: "en-US",
  }
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validates metadata for common SEO issues
 */
export function validateMetadata(metadata: Metadata): {
  isValid: boolean
  warnings: string[]
  errors: string[]
} {
  const warnings: string[] = []
  const errors: string[] = []

  // Title validation
  if (!metadata.title) {
    errors.push("Title is required")
  } else {
    const titleLength = typeof metadata.title === "string" ? metadata.title.length : metadata.title.default?.length || 0

    if (titleLength > SEO_CONFIG.titleLimit) {
      warnings.push(`Title is ${titleLength} characters, recommended max is ${SEO_CONFIG.titleLimit}`)
    }
    if (titleLength < 10) {
      warnings.push("Title is too short, recommended minimum is 10 characters")
    }
  }

  // Description validation
  if (!metadata.description) {
    errors.push("Description is required")
  } else {
    if (metadata.description.length > SEO_CONFIG.descriptionLimit) {
      warnings.push(
        `Description is ${metadata.description.length} characters, recommended max is ${SEO_CONFIG.descriptionLimit}`,
      )
    }
    if (metadata.description.length < 50) {
      warnings.push("Description is too short, recommended minimum is 50 characters")
    }
  }

  // OpenGraph validation
  if (!metadata.openGraph?.images?.length) {
    warnings.push("OpenGraph image is recommended for better social sharing")
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  }
}

/**
 * Optimizes content for SEO
 */
export function optimizeContentForSEO(content: string): {
  optimizedContent: string
  keywords: string[]
  readabilityScore: number
  suggestions: string[]
} {
  const suggestions: string[] = []

  // Extract keywords
  const keywords = extractKeywords(content, SEO_CONFIG.keywordsLimit)

  // Basic readability analysis
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  const words = content.split(/\s+/).filter((w) => w.length > 0)
  const avgWordsPerSentence = words.length / sentences.length

  let readabilityScore = 100
  if (avgWordsPerSentence > 20) {
    readabilityScore -= 20
    suggestions.push("Consider shorter sentences for better readability")
  }

  // Content optimization
  const optimizedContent = content
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()

  // Add suggestions based on content analysis
  if (content.length < 300) {
    suggestions.push("Content is quite short, consider adding more detail")
  }

  if (keywords.length < 3) {
    suggestions.push("Consider adding more relevant keywords to improve SEO")
  }

  return {
    optimizedContent,
    keywords,
    readabilityScore,
    suggestions,
  }
}
