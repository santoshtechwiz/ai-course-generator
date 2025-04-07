// Base URL utility
export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"
}

// Types for schema data
export interface BreadcrumbItem {
  name: string
  url: string
}

export interface ArticleData {
  headline: string
  description: string
  url: string
  imageUrl: string
  datePublished: string
  dateModified?: string
  authorName: string
  publisherName: string
  publisherLogoUrl: string
}

export interface CourseData {
  title: string
  description: string
  image?: string
  createdAt: string
  updatedAt?: string
  instructor?: {
    name: string
    url: string
  }
  difficulty?: string
  estimatedHours?: number
  courseUnits?: any[]
}

export interface QuizData {
  title: string
  description: string
  url: string
  questions?: any[]
  dateCreated?: string
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

export type Schema = Record<string, any>

// Generate breadcrumb items from URL path
export function generateBreadcrumbItemsFromPath(path: string): BreadcrumbItem[] {
  const baseUrl = getBaseUrl()
  const segments = path.split("/").filter(Boolean)

  const breadcrumbs: BreadcrumbItem[] = [{ name: "Home", url: baseUrl }]

  let currentPath = ""
  segments.forEach((segment) => {
    currentPath += `/${segment}`
    const name = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    breadcrumbs.push({
      name,
      url: `${baseUrl}${currentPath}`,
    })
  })

  return breadcrumbs
}

// Generate website schema
export function generateWebsiteSchema(): Schema {
  const baseUrl = getBaseUrl()

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "CourseAI",
    description: "AI-powered coding education platform with interactive courses, quizzes, and learning tools",
    publisher: {
      "@type": "Organization",
      name: "CourseAI",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }
}

// Generate web application schema
export function generateWebApplicationSchema(): Schema {
  const baseUrl = getBaseUrl()

  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "CourseAI",
    url: baseUrl,
    applicationCategory: "EducationalApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description: "AI-powered coding education platform with interactive courses, quizzes, and learning tools",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "250",
    },
  }
}

// Generate organization schema
export function generateOrganizationSchema2(): Schema {
  const baseUrl = getBaseUrl()

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "CourseAI",
    url: baseUrl,
    logo: {
      "@type": "ImageObject",
      url: `${baseUrl}/logo.png`,
      width: 112,
      height: 112,
    },
    sameAs: [
      "https://twitter.com/courseai",
      "https://www.linkedin.com/company/courseai",
      "https://github.com/courseai",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@courseai.io",
    },
  }
}

// Generate breadcrumb schema
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

// Generate article schema
export function generateArticleSchema(data: ArticleData): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": data.url,
    },
    headline: data.headline,
    description: data.description,
    image: data.imageUrl,
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    author: {
      "@type": "Person",
      name: data.authorName,
    },
    publisher: {
      "@type": "Organization",
      name: data.publisherName,
      logo: {
        "@type": "ImageObject",
        url: data.publisherLogoUrl,
      },
    },
  }
}

// Generate course schema with required fields
export function generateCourseSchema(data: CourseData): Schema {
  const baseUrl = getBaseUrl()

  // Calculate course workload based on estimated hours or default to a reasonable value
  const workload = data.estimatedHours ? `PT${data.estimatedHours}H` : "PT10H" // Default 10 hours if not specified

  // Create course units as learning objectives if available
  const learningObjectives = data.courseUnits?.map((unit) => unit.title) || [
    "Master programming fundamentals",
    "Build practical coding skills",
    "Complete hands-on projects",
  ]

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: data.title,
    description: data.description,
    provider: {
      "@type": "Organization",
      name: "CourseAI",
      sameAs: baseUrl,
    },
    url: `${baseUrl}/dashboard/course/${data.title.toLowerCase().replace(/\s+/g, "-")}`,
    dateCreated: data.createdAt,
    dateModified: data.updatedAt || data.createdAt,
    image: data.image || `${baseUrl}/default-course-image.jpg`,
    inLanguage: "en",
    courseWorkload: workload,
    timeRequired: workload,
    educationalLevel: data.difficulty || "Beginner to Advanced",
    teaches: learningObjectives.join(", "),
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT10H", // Default 10 hours if not specified
      instructor: data.instructor
        ? {
            "@type": "Person",
            name: data.instructor.name,
            url: data.instructor.url,
          }
        : {
            "@type": "Person",
            name: "CourseAI Instructor",
          },
    },
    mainEntity: {
      "@type": "LearningResource",
      name: data.title,
      description: data.description,
      learningResourceType: "Course",
      educationalLevel: data.difficulty || "Beginner to Advanced",
      teaches: learningObjectives.join(", "),
    },
  }
}

// Generate quiz schema
export function generateQuizSchema(data: QuizData): Schema {
  const baseUrl = getBaseUrl()

  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: data.title,
    description: data.description,
    url: data.url,
    dateCreated: data.dateCreated || new Date().toISOString(),
    author: data.author
      ? {
          "@type": "Person",
          name: data.author.name,
          url: data.author.url,
        }
      : {
          "@type": "Organization",
          name: "CourseAI",
          url: baseUrl,
        },
    mainEntity: {
      "@type": "Question",
      name: data.title,
      text: data.description,
    },
    about: {
      "@type": "Thing",
      name: "Programming Education",
    },
  }
}

// Generate FAQ schema
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

// Generate How-To schema
export function generateHowToSchema(data: {
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
    name: data.name,
    description: data.description,
    image: data.imageUrl,
    totalTime: data.totalTime,
    step: data.steps.map((step, index) => ({
      "@type": "HowToStep",
      url: step.url || `${data.url}#step-${index + 1}`,
      name: step.name,
      itemListElement: {
        "@type": "HowToDirection",
        text: step.text,
      },
      image: step.imageUrl,
    })),
  }
}

// Generate pricing schema
export function generatePricingSchema(): Schema {
  const baseUrl = getBaseUrl()

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "CourseAI Premium Subscription",
    description: "Access to all premium features of CourseAI's coding education platform",
    image: `${baseUrl}/premium-subscription.jpg`,
    offers: [
      {
        "@type": "Offer",
        name: "Free Plan",
        price: "0",
        priceCurrency: "USD",
        description: "Basic access to CourseAI's learning platform",
        url: `${baseUrl}/dashboard/subscription`,
      },
      {
        "@type": "Offer",
        name: "Premium Monthly",
        price: "19.99",
        priceCurrency: "USD",
        description: "Full access to all premium features with monthly billing",
        url: `${baseUrl}/dashboard/subscription`,
      },
      {
        "@type": "Offer",
        name: "Premium Annual",
        price: "199.99",
        priceCurrency: "USD",
        description: "Full access to all premium features with annual billing (save 17%)",
        url: `${baseUrl}/dashboard/subscription`,
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "250",
    },
  }
}

