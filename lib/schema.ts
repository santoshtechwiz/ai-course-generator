// Base URL utility
export function getBaseUrl(): string {
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
  description?: string
  url: string
  image?: string
  createdAt: string
  updatedAt?: string
  instructor?: {
    name: string
    url: string
  }
  provider?: {
    name: string
    url?: string
  }
  difficulty?: string
  estimatedHours?: number
  courseUnits?: Array<{ title: string }>
  price?: string
  priceCurrency?: string
  priceValidUntil?: string
}

export interface QuizData {
  title: string
  description: string
  url: string
  questions?: Array<{
    question: string
    acceptedAnswer: string
  }>
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

export interface HowToData {
  name: string
  description: string
  url: string
  imageUrl: string
  totalTime: string
  steps: HowToStep[]
}

export interface PricingPlan {
  name: string
  price: string
  priceCurrency: string
  description: string
  url: string
}

export interface SoftwareApplicationData {
  name: string
  description: string
  url: string
  applicationCategory: string
  operatingSystem?: string
  offers?: {
    price: string
    priceCurrency: string
    priceValidUntil?: string
  }
  aggregateRating?: {
    ratingValue: string
    ratingCount: string
  }
  screenshot?: string
  featureList?: string[]
}

export interface PersonData {
  name: string
  url?: string
  image?: string
  jobTitle?: string
  worksFor?: {
    name: string
    url?: string
  }
  description?: string
  sameAs?: string[]
}

export interface VideoData {
  name: string
  description: string
  thumbnailUrl: string
  uploadDate: string
  contentUrl?: string
  embedUrl?: string
  duration?: string // ISO 8601 format
  publisher?: {
    name: string
    url?: string
    logo?: string
  }
}

export type Schema = Record<string, any>

// Generate breadcrumb items from URL path
export function generateBreadcrumbItemsFromPath(path: string): BreadcrumbItem[] {
  const baseUrl = getBaseUrl()
  const segments = path.split("/").filter(Boolean)

  const breadcrumbs: BreadcrumbItem[] = [{ name: "Home", url: baseUrl }]

  let currentPath = ""
  for (const segment of segments) {
    currentPath += `/${segment}`
    const name = segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")

    breadcrumbs.push({
      name,
      url: `${baseUrl}${currentPath}`,
    })
  }

  return breadcrumbs
}

// Schema Generators
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
        width: 112,
        height: 112,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  }
}

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
      bestRating: "5",
    },
  }
}

export function generateSoftwareApplicationSchema(data?: Partial<SoftwareApplicationData>): Schema {
  const baseUrl = getBaseUrl()
  const defaultData: SoftwareApplicationData = {
    name: "CourseAI",
    description: "AI-powered coding education platform with interactive courses, quizzes, and learning tools",
    url: baseUrl,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web, iOS, Android",
    offers: {
      price: "0",
      priceCurrency: "USD",
    },
    aggregateRating: {
      ratingValue: "4.8",
      ratingCount: "250",
    },
    screenshot: `${baseUrl}/images/app-screenshot.jpg`,
    featureList: [
      "AI-generated quizzes",
      "Interactive coding exercises",
      "Course creation tools",
      "Learning analytics",
    ],
  }

  const mergedData = { ...defaultData, ...data }

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: mergedData.name,
    description: mergedData.description,
    url: mergedData.url,
    applicationCategory: mergedData.applicationCategory,
    operatingSystem: mergedData.operatingSystem,
    offers: mergedData.offers
      ? {
          "@type": "Offer",
          price: mergedData.offers.price,
          priceCurrency: mergedData.offers.priceCurrency,
          ...(mergedData.offers.priceValidUntil && { priceValidUntil: mergedData.offers.priceValidUntil }),
        }
      : undefined,
    ...(mergedData.aggregateRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: mergedData.aggregateRating.ratingValue,
        ratingCount: mergedData.aggregateRating.ratingCount,
        bestRating: "5",
      },
    }),
    ...(mergedData.screenshot && { screenshot: mergedData.screenshot }),
    ...(mergedData.featureList && { featureList: mergedData.featureList.join(", ") }),
  }
}

export function generateOrganizationSchema(): Schema {
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
      url: `${baseUrl}/contact`,
    },
  }
}

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
        width: 112,
        height: 112,
      },
    },
  }
}

export function generateCourseSchema(course: CourseData): Schema {
  const baseUrl = getBaseUrl()
  const defaultCourseImage = `${baseUrl}/images/default-course.jpg`

  // Default provider if not specified
  const defaultProvider = {
    "@type": "Organization",
    name: "CourseAI",
    sameAs: baseUrl,
  }

  // Ensure description is always present
  const courseDescription = course.description || `Learn ${course.title} with CourseAI`

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: courseDescription,
    url: course.url,
    image: course.image || defaultCourseImage,
    provider: course.provider
      ? {
          "@type": "Organization",
          name: course.provider.name,
          ...(course.provider.url && { sameAs: course.provider.url }),
        }
      : defaultProvider,
    educationalLevel: course.difficulty || "Beginner",
    timeRequired: course.estimatedHours ? `PT${course.estimatedHours}H` : undefined,
      category: "Programming",
    dateCreated: course.createdAt,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseWorkload: "PT1H",
      name: course.title,
      description: courseDescription,
      courseMode: "online",
      startDate: course.createdAt,
      endDate: course.updatedAt || course.createdAt,
      location: {
        "@type": "VirtualLocation",
        url: course.url,
      },
    },
    ...(course.instructor && {
      instructor: {
        "@type": "Person",
        name: course.instructor.name || "CourseAI Instructor",
        url: course.instructor.url || getBaseUrl(),
      },
    }),
    ...(course.courseUnits && {
      hasPart: course.courseUnits.map((unit) => ({
        "@type": "Course",
        name: unit.title,
        description: unit.title || "Course unit",
        url: `${course.url}#${unit.title.replace(/\s+/g, "-").toLowerCase()}`,
        image: course.image || defaultCourseImage,
        provider: {
          "@type": "Organization",
          name: "CourseAI",
          sameAs: baseUrl,
        },
      })),
    }),
    offers: {
      "@type": "Offer",
      price: course.price || "0",
      category: "https://schema.org/OnlineCourse",
      priceCurrency: course.priceCurrency || "USD",
      url: course.url,
      availability: "https://schema.org/InStock",
      ...(course.priceValidUntil && { priceValidUntil: course.priceValidUntil }),
    },
  }
}

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
    ...(data.questions && {
      hasPart: data.questions.map((q) => ({
        "@type": "Question",
        name: q.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: q.acceptedAnswer,
        },
      })),
    }),
    about: {
      "@type": "Thing",
      name: "Programming Education",
    },
  }
}

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

export function generateHowToSchema(data: HowToData): Schema {
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
      ...(step.imageUrl && { image: step.imageUrl }),
    })),
  }
}

export function generatePricingSchema(plans: PricingPlan[] = []): Schema {
  const baseUrl = getBaseUrl()
  const defaultPlans: PricingPlan[] = [
    {
      name: "Free Plan",
      price: "0",
      priceCurrency: "USD",
      description: "Basic access to CourseAI's learning platform",
      url: `${baseUrl}/pricing`,
    },
    {
      name: "Premium Monthly",
      price: "19.99",
      priceCurrency: "USD",
      description: "Full access to all premium features with monthly billing",
      url: `${baseUrl}/pricing`,
    },
    {
      name: "Premium Annual",
      price: "199.99",
      priceCurrency: "USD",
      description: "Full access to all premium features with annual billing (save 17%)",
      url: `${baseUrl}/pricing`,
    },
  ]

  const offers = (plans.length > 0 ? plans : defaultPlans).map((plan) => ({
    "@type": "Offer",
    name: plan.name,
    price: plan.price,
    priceCurrency: plan.priceCurrency,
    description: plan.description,
    url: plan.url,
  }))

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "CourseAI Premium Subscription",
    description: "Access to all premium features of CourseAI's coding education platform",
    image: `${baseUrl}/images/premium-subscription.jpg`,
    offers,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "250",
      bestRating: "5",
    },
  }
}

export function generatePersonSchema(data: PersonData): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: data.name,
    ...(data.url && { url: data.url }),
    ...(data.image && { image: data.image }),
    ...(data.jobTitle && { jobTitle: data.jobTitle }),
    ...(data.worksFor && {
      worksFor: {
        "@type": "Organization",
        name: data.worksFor.name,
        ...(data.worksFor.url && { url: data.worksFor.url }),
      },
    }),
    ...(data.description && { description: data.description }),
    ...(data.sameAs && { sameAs: data.sameAs }),
  }
}

export function generateVideoSchema(data: VideoData): Schema {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: data.name,
    description: data.description,
    thumbnailUrl: data.thumbnailUrl,
    uploadDate: data.uploadDate,
    ...(data.contentUrl && { contentUrl: data.contentUrl }),
    ...(data.embedUrl && { embedUrl: data.embedUrl }),
    ...(data.duration && { duration: data.duration }),
    ...(data.publisher && {
      publisher: {
        "@type": "Organization",
        name: data.publisher.name,
        ...(data.publisher.url && { url: data.publisher.url }),
        ...(data.publisher.logo && {
          logo: {
            "@type": "ImageObject",
            url: data.publisher.logo,
            width: 112,
            height: 112,
          },
        }),
      },
    }),
  }
}

// Schema Registry for better organization and extensibility
export const SchemaRegistry = {
  Website: generateWebsiteSchema,
  WebApplication: generateWebApplicationSchema,
  SoftwareApplication: generateSoftwareApplicationSchema,
  Organization: generateOrganizationSchema,
  Breadcrumb: generateBreadcrumbSchema,
  Article: generateArticleSchema,
  Course: generateCourseSchema,
  Quiz: generateQuizSchema,
  FAQ: generateFAQSchema,
  HowTo: generateHowToSchema,
  Pricing: generatePricingSchema,
  Person: generatePersonSchema,
  Video: generateVideoSchema,
}

// Helper function to validate schema data
export function validateSchema(schema: Schema): boolean {
  try {
    // Basic validation - ensure required fields are present
    if (!schema["@context"] || !schema["@type"]) {
      console.error("Schema missing required fields: @context or @type")
      return false
    }

    // Check for nested objects without required fields
    const validateNestedObjects = (obj: any) => {
      for (const key in obj) {
        if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
          if (obj[key]["@type"] && !validateTypeSpecificFields(obj[key])) {
            return false
          }
          if (!validateNestedObjects(obj[key])) {
            return false
          }
        }
      }
      return true
    }

    // Validate fields specific to schema type
    const validateTypeSpecificFields = (obj: any) => {
      const type = obj["@type"]

      switch (type) {
        case "ImageObject":
          if (!obj.url) {
            console.error("ImageObject missing required field: url")
            return false
          }
          break
        case "Organization":
          if (!obj.name) {
            console.error("Organization missing required field: name")
            return false
          }
          break
        case "Person":
          if (!obj.name) {
            console.error("Person missing required field: name")
            return false
          }
          break
        case "Offer":
          if (obj.price === undefined || !obj.priceCurrency) {
            console.error("Offer missing required fields: price or priceCurrency")
            return false
          }
          break
        case "AggregateRating":
          if (!obj.ratingValue || !obj.ratingCount) {
            console.error("AggregateRating missing required fields: ratingValue or ratingCount")
            return false
          }
          break
        case "Course":
          if (!obj.name || !obj.description) {
            console.error("Course missing required fields: name or description")
            return false
          }
          if (!obj.provider) {
            console.error("Course missing recommended field: provider")
            // Don't return false for non-critical issues
          }
          break
      }

      return true
    }

    return validateTypeSpecificFields(schema) && validateNestedObjects(schema)
  } catch (error) {
    console.error("Schema validation error:", error)
    return false
  }
}

