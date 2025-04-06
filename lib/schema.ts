/**
 * Unified schema management module
 * Contains all types, generators, and utilities for structured data
 */

// Base Schema type for all JSON-LD schemas
export type Schema = Record<string, any>

// Common schema types
export interface BreadcrumbItem {
  name: string
  url: string
}

export interface CourseData {
  title: string
  description: string
  image?: string
  url?: string
  createdAt: string
  updatedAt?: string
  instructor?: {
    name: string
    url: string
  }
}

export interface QuizData {
  title: string
  description: string
  url: string
  questionCount: number
  timeRequired?: string
  educationalLevel?: string
  author?: {
    name: string
    url: string
  }
}

export interface FAQItem {
  question: string
  answer: string
}

export interface HowToStep {
  name: string
  text: string
  url?: string
  imageUrl?: string
}

export interface ArticleData {
  headline: string
  description: string
  url: string
  imageUrl: string
  datePublished: string
  dateModified?: string
  authorName: string
  authorUrl?: string
  publisherName: string
  publisherLogoUrl: string
}

/**
 * Get the base URL for the site
 */
export function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"
}

/**
 * Create a schema for an organization
 */
export function createOrganizationSchema(options?: {
  name?: string
  url?: string
  logoUrl?: string
  sameAs?: string[]
  contactPhone?: string
  contactEmail?: string
}): Schema {
  const baseUrl = getBaseUrl()
  const name = options?.name || "CourseAI"

  return {
    "@type": "Organization",
    name,
    url: options?.url || baseUrl,
    logo: {
      "@type": "ImageObject",
      url: options?.logoUrl || `${baseUrl}/logo.png`,
      width: "180",
      height: "60",
    },
    sameAs:
      options?.sameAs ||
      [
        "https://twitter.com/courseai",
        "https://facebook.com/courseai",
        "https://linkedin.com/company/courseai",
        "https://github.com/courseai",
        "https://youtube.com/courseai",
        "https://instagram.com/courseai.official",
      ].filter(Boolean),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: options?.contactPhone || process.env.NEXT_PUBLIC_CONTACT_PHONE || "+1-800-123-4567",
      contactType: "customer service",
      email: options?.contactEmail || process.env.NEXT_PUBLIC_CONTACT_EMAIL || "webmaster.codeguru@gmail.com",
      availableLanguage: ["English", "Spanish", "French", "German"],
      contactOption: "TollFree",
    },
  }
}

/**
 * Create a schema for a person
 */
export function createPersonSchema(name: string, url?: string): Schema {
  return {
    "@type": "Person",
    name,
    ...(url && { url }),
  }
}

/**
 * Generate breadcrumb schema
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]): Schema {
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
 * Generate breadcrumb items from pathname
 */
export function generateBreadcrumbItemsFromPath(pathname: string): BreadcrumbItem[] {
  const baseUrl = getBaseUrl()
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

  return breadcrumbItems
}

/**
 * Generate course schema
 */
export function generateCourseSchema(course: CourseData): Schema {
  const baseUrl = getBaseUrl()

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.description,
    provider: createOrganizationSchema(),
    dateCreated: course.createdAt,
    dateModified: course.updatedAt || course.createdAt,
    url: course.url || baseUrl,
    ...(course.image && { image: course.image }),
    ...(course.instructor && {
      instructor: createPersonSchema(course.instructor.name, course.instructor.url),
    }),
    inLanguage: "en",
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      provider: createOrganizationSchema(),
    },
  }
}

/**
 * Generate quiz schema
 */
export function generateQuizSchema(quiz: QuizData): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: quiz.title,
    description: quiz.description,
    url: quiz.url,
    numberOfQuestions: quiz.questionCount,
    provider: createOrganizationSchema(),
    isAccessibleForFree: true,
    ...(quiz.timeRequired && { timeRequired: quiz.timeRequired }),
    ...(quiz.educationalLevel && {
      educationalAlignment: {
        "@type": "AlignmentObject",
        educationalFramework: "Programming Skills",
        targetName: "Coding Knowledge Assessment",
        alignmentType: "assesses",
        educationalLevel: quiz.educationalLevel,
      },
    }),
    ...(quiz.author && {
      author: createPersonSchema(quiz.author.name, quiz.author.url),
    }),
  }
}

/**
 * Generate FAQ schema
 */
export function generateFAQSchema(items: FAQItem[]): Schema {
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

/**
 * Generate website schema
 */
export function generateWebsiteSchema(): Schema {
  const baseUrl = getBaseUrl()

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: baseUrl,
    name: "CourseAI - Free Programming Education Platform",
    alternateName: ["CourseAI Free Coding Resources", "CourseAI Programming Tutorials"],
    description:
      "An intelligent learning platform offering 100% free coding quizzes, programming courses, and AI-powered educational resources.",
    potentialAction: [
      {
        "@type": "SearchAction",
        target: `${baseUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    ],
    publisher: createOrganizationSchema(),
  }
}

/**
 * Generate web application schema
 */
export function generateWebApplicationSchema(): Schema {
  const baseUrl = getBaseUrl()

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "CourseAI Quiz Generator",
    applicationCategory: "EducationalApplication",
    applicationSubCategory: "Learning Tool",
    operatingSystem: "Web, iOS, Android",
    description: "100% free AI-powered platform for creating quizzes, assessments, and educational content instantly.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      validFrom: "2023-01-01",
      priceValidUntil: "2099-12-31",
    },
    featureList: [
      "Free AI Quiz Generation",
      "Free Multiple Choice Questions",
      "Free Custom Templates",
      "Free Analytics Dashboard",
      "Free Automated Grading",
    ],
    provider: createOrganizationSchema(),
  }
}

/**
 * Generate pricing schema
 */
export function generatePricingSchema(): Schema {
  const baseUrl = getBaseUrl()

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "CourseAI Learning Platform",
    description: "AI-powered platform for creating courses, quizzes, and educational content with a generous free tier",
    image: [`${baseUrl}/images/courseai-logo.png`, `${baseUrl}/images/courseai-dashboard.png`],
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "0",
      highPrice: "49.99",
      offerCount: "3",
      offers: [
        {
          "@type": "Offer",
          name: "Free Forever Plan",
          price: "0",
          priceCurrency: "USD",
          description: "Unlimited access to all basic features with no time limits or trial periods",
          url: `${baseUrl}/pricing#free-forever`,
          availability: "https://schema.org/InStock",
          priceValidUntil: "2099-12-31",
        },
        {
          "@type": "Offer",
          name: "Basic Plan",
          price: "19.99",
          priceCurrency: "USD",
          description: "25 Hosted Courses plus advanced features",
          url: `${baseUrl}/pricing#basic`,
          availability: "https://schema.org/InStock",
          priceValidUntil: "2024-12-31",
        },
        {
          "@type": "Offer",
          name: "Premium Plan",
          price: "49.99",
          priceCurrency: "USD",
          description: "Unlimited courses and premium features",
          url: `${baseUrl}/pricing#premium`,
          availability: "https://schema.org/InStock",
          priceValidUntil: "2024-12-31",
        },
      ],
    },
    brand: {
      "@type": "Brand",
      name: "CourseAI",
    },
  }
}

/**
 * Generate article schema
 */
export function generateArticleSchema(article: ArticleData): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.headline,
    description: article.description,
    image: article.imageUrl,
    datePublished: new Date(article.datePublished).toISOString(),
    ...(article.dateModified && { dateModified: new Date(article.dateModified).toISOString() }),
    author: createPersonSchema(article.authorName, article.authorUrl),
    publisher: {
      "@type": "Organization",
      name: article.publisherName,
      logo: {
        "@type": "ImageObject",
        url: article.publisherLogoUrl,
        width: "180",
        height: "60",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": article.url,
    },
    isAccessibleForFree: true,
  }
}

/**
 * Generate how-to schema
 */
export function generateHowToSchema(params: {
  name: string
  description: string
  url: string
  imageUrl: string
  totalTime: string
  steps: HowToStep[]
}): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: params.name,
    description: params.description,
    image: params.imageUrl,
    totalTime: params.totalTime,
    step: params.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.url && { url: step.url }),
      ...(step.imageUrl && {
        image: {
          "@type": "ImageObject",
          url: step.imageUrl,
        },
      }),
    })),
    isAccessibleForFree: true,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": params.url,
    },
  }
}
export function generateOrganizationSchema2(): Schema {
  return createOrganizationSchema()
}