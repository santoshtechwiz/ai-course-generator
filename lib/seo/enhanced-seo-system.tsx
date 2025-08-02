"use client"

/**
 * Enhanced SEO System for CourseAI Platform
 * Addresses Google Search Console issues and improves SEO compliance
 */

import React from 'react'
import { Metadata } from 'next'
import { BASE_URL, defaultSiteInfo, defaultFAQItems } from './constants'

// ============================================================================
// ENHANCED COURSE SCHEMA WITH REQUIRED FIELDS
// ============================================================================

export interface EnhancedCourseData {
  title: string
  description: string
  slug: string
  image?: string
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced'
  category?: { name: string } | string
  author?: string
  createdAt: string
  updatedAt?: string
  estimatedHours?: number
  price?: number
  currency?: string
  chapters?: Array<{ title: string; description?: string }>
  skills?: string[]
}

export function generateEnhancedCourseSchema(course: EnhancedCourseData) {
  const baseUrl = BASE_URL
  const courseUrl = `${baseUrl}/dashboard/course/${course.slug}`
  const categoryName = typeof course.category === 'object' && course.category?.name 
    ? course.category.name 
    : (typeof course.category === 'string' ? course.category : 'Programming')

  const schema = {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": courseUrl,
    "name": course.title,
    "description": course.description || `Learn ${course.title} with comprehensive interactive content and hands-on exercises.`,
    "url": courseUrl,
    "image": course.image || `${baseUrl}/api/og?title=${encodeURIComponent(course.title)}&category=${encodeURIComponent(categoryName)}`,
    "provider": {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      "name": "CourseAI",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`,
        "width": 112,
        "height": 112
      },
      "sameAs": [
        "https://twitter.com/courseai",
        "https://linkedin.com/company/courseai",
        "https://github.com/courseai"
      ]
    },
    "educationalLevel": course.difficulty || "Beginner",
    "timeRequired": `PT${course.estimatedHours || 10}H`,
    "inLanguage": "en",
    "dateCreated": course.createdAt,
    "dateModified": course.updatedAt || course.createdAt,
    "category": categoryName,
    "about": {
      "@type": "Thing",
      "name": categoryName,
      "description": `${categoryName} programming and development skills`
    },
    "teaches": course.skills || [
      `${course.title} fundamentals`,
      `${categoryName} best practices`,
      "Practical implementation skills",
      "Real-world project development"
    ],
    "hasCourseInstance": {
      "@type": "CourseInstance",
      "@id": `${courseUrl}#instance`,
      "name": course.title,
      "description": course.description || `Interactive ${course.title} course with AI-powered content`,
      "courseMode": "online",
      "courseWorkload": `PT${course.estimatedHours || 10}H`,
      "startDate": course.createdAt,
      "endDate": course.updatedAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      "location": {
        "@type": "VirtualLocation",
        "url": courseUrl,
        "name": "CourseAI Online Platform"
      },
      "instructor": {
        "@type": "Organization",
        "name": "CourseAI",
        "url": baseUrl,
        "description": "AI-powered educational platform with expert content curation"
      }
    },
    "hasPart": course.chapters?.map((chapter, index) => ({
      "@type": "Course",
      "@id": `${courseUrl}#chapter-${index + 1}`,
      "name": chapter.title,
      "description": chapter.description || `Chapter ${index + 1}: ${chapter.title}`,
      "url": `${courseUrl}#chapter-${index + 1}`,
      "position": index + 1,
      "isPartOf": {
        "@id": courseUrl
      }
    })) || [
      {
        "@type": "Course",
        "@id": `${courseUrl}#introduction`,
        "name": `Introduction to ${course.title}`,
        "description": `Getting started with ${course.title}`,
        "url": `${courseUrl}#introduction`,
        "position": 1
      }
    ],
    "offers": {
      "@type": "Offer",
      "@id": `${courseUrl}#offer`,
      "price": (course.price || 0).toString(),
      "priceCurrency": course.currency || "USD",
      "url": courseUrl,
      "availability": "https://schema.org/InStock",
      "validFrom": course.createdAt,
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
      "category": "https://schema.org/EducationalOccupationalCredential"
    }
  }

  return schema
}

// ============================================================================
// ENHANCED QUIZ SCHEMA
// ============================================================================

export interface EnhancedQuizData {
  title: string
  description?: string
  slug: string
  quizType: string
  difficulty?: string
  questionsCount: number
  timeRequired?: number
  author?: string
  createdAt: string
  category?: string
  questions?: Array<{ question: string; correctAnswer: string }>
}

export function generateEnhancedQuizSchema(quiz: EnhancedQuizData) {
  const baseUrl = BASE_URL
  const quizUrl = `${baseUrl}/dashboard/${quiz.quizType}/${quiz.slug}`

  const schema = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "@id": quizUrl,
    "name": quiz.title,
    "description": quiz.description || `Test your knowledge with our ${quiz.title} quiz. ${quiz.questionsCount} questions to assess your understanding.`,
    "url": quizUrl,
    "numberOfQuestions": quiz.questionsCount,
    "timeRequired": quiz.timeRequired ? `PT${quiz.timeRequired}M` : "PT15M",
    "educationalLevel": quiz.difficulty || "Beginner",
    "educationalUse": "Assessment",
    "learningResourceType": "Quiz",
    "inLanguage": "en",
    "dateCreated": quiz.createdAt,
    "author": {
      "@type": "Organization",
      "name": "CourseAI",
      "url": baseUrl
    },
    "publisher": {
      "@type": "Organization",
      "name": "CourseAI",
      "url": baseUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${baseUrl}/logo.png`,
        "width": 112,
        "height": 112
      }
    },
    "about": {
      "@type": "Thing",
      "name": quiz.category || "Programming",
      "description": `${quiz.category || 'Programming'} knowledge assessment`
    },
    "mainEntity": quiz.questions?.map((q, index) => ({
      "@type": "Question",
      "@id": `${quizUrl}#question-${index + 1}`,
      "name": q.question,
      "position": index + 1,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": q.correctAnswer
      }
    })) || []
  }

  return schema
}

// ============================================================================
// ENHANCED FAQ SCHEMA
// ============================================================================

export function generateEnhancedFAQSchema(faqs = defaultFAQItems) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq, index) => ({
      "@type": "Question",
      "@id": `${BASE_URL}#faq-${index + 1}`,
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer,
        "author": {
          "@type": "Organization",
          "name": "CourseAI"
        }
      }
    }))
  }

  return schema
}

// ============================================================================
// WEBSITE SCHEMA WITH SEARCH ACTION
// ============================================================================

export function generateEnhancedWebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    "url": BASE_URL,
    "name": "CourseAI",
    "alternateName": ["Course AI", "AI Learning Platform", "CourseAI Platform"],
    "description": "AI-powered educational platform for creating interactive courses, quizzes, and learning assessments",
    "inLanguage": "en",
    "publisher": {
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      "name": "CourseAI"
    },
    "potentialAction": [
      {
        "@type": "SearchAction",
        "@id": `${BASE_URL}/#search`,
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${BASE_URL}/search?q={search_term_string}`,
          "actionPlatform": [
            "https://schema.org/DesktopWebPlatform",
            "https://schema.org/MobileWebPlatform"
          ]
        },
        "query-input": "required name=search_term_string"
      }
    ]
  }

  return schema
}

// ============================================================================
// ORGANIZATION SCHEMA
// ============================================================================

export function generateEnhancedOrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    "name": "CourseAI",
    "alternateName": ["Course AI", "AI Learning Platform"],
    "url": BASE_URL,
    "logo": {
      "@type": "ImageObject",
      "url": `${BASE_URL}/logo.png`,
      "width": 112,
      "height": 112,
      "caption": "CourseAI Logo"
    },
    "description": "AI-powered educational technology platform specializing in interactive course creation, quiz generation, and personalized learning experiences",
    "foundingDate": "2023-01-01",
    "slogan": "Learn, Create, Excel with AI",
    "sameAs": [
      "https://twitter.com/courseai",
      "https://linkedin.com/company/courseai",
      "https://github.com/courseai",
      "https://facebook.com/courseailearning",
      "https://youtube.com/c/courseai"
    ],
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "email": "support@courseai.io",
        "url": `${BASE_URL}/contact`,
        "availableLanguage": ["English"],
        "areaServed": "Worldwide"
      }
    ],
    "areaServed": "Worldwide",
    "serviceType": [
      "Educational Technology",
      "Online Learning Platform",
      "AI-Powered Content Creation",
      "Assessment Tools"
    ],
    "knowsAbout": [
      "Artificial Intelligence",
      "Educational Technology",
      "Online Learning",
      "Programming Education",
      "Quiz Generation",
      "Course Creation"
    ]
  }

  return schema
}

// ============================================================================
// BREADCRUMB SCHEMA GENERATOR
// ============================================================================

export function generateEnhancedBreadcrumbSchema(
  path: string,
  customItems?: Array<{ name: string; url: string }>
) {
  if (customItems) {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": customItems.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": item.name,
        "item": item.url
      }))
    }
  }

  // Auto-generate breadcrumbs from path
  const pathSegments = path.split('/').filter(Boolean)
  const breadcrumbs = [
    { name: "Home", url: BASE_URL }
  ]

  let currentPath = BASE_URL
  for (const segment of pathSegments) {
    currentPath += `/${segment}`
    const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
    breadcrumbs.push({ name, url: currentPath })
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  }
}

// ============================================================================
// ENHANCED METADATA GENERATION
// ============================================================================

export interface EnhancedMetadataConfig {
  title: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'profile'
  author?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
  noIndex?: boolean
  noFollow?: boolean
  canonical?: string
  alternateLanguages?: Array<{ hrefLang: string; href: string }>
}

export function generateEnhancedMetadata(config: EnhancedMetadataConfig): Metadata {
  const {
    title,
    description = "AI-powered learning platform with interactive courses, quizzes, and personalized education tools",
    keywords = [],
    image,
    url,
    type = "website",
    author,
    publishedTime,
    modifiedTime,
    section,
    tags = [],
    noIndex = false,
    noFollow = false,
    canonical,
    alternateLanguages = []
  } = config

  const fullTitle = title.includes('CourseAI') ? title : `${title} | CourseAI`
  const socialImage = image || `${BASE_URL}/api/og?title=${encodeURIComponent(title)}`
  const pageUrl = url || BASE_URL

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: author ? [{ name: author }] : [{ name: 'CourseAI Team' }],
    generator: 'CourseAI',
    applicationName: 'CourseAI',
    referrer: 'origin-when-cross-origin',
    creator: 'CourseAI',
    publisher: 'CourseAI',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(BASE_URL),
    robots: {
      index: !noIndex,
      follow: !noFollow,
      googleBot: {
        index: !noIndex,
        follow: !noFollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type,
      locale: 'en_US',
      url: pageUrl,
      title: fullTitle,
      description,
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      siteName: 'CourseAI',
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { authors: [author] }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [socialImage],
      creator: '@courseai',
      site: '@courseai',
    },
    alternates: {
      canonical: canonical || pageUrl,
      ...(alternateLanguages.length > 0 && {
        languages: Object.fromEntries(
          alternateLanguages.map(lang => [lang.hrefLang, lang.href])
        )
      })
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
      yahoo: process.env.YAHOO_VERIFICATION,
    },
    ...(process.env.NEXT_PUBLIC_APP_URL && {
      manifest: `${process.env.NEXT_PUBLIC_APP_URL}/manifest.json`
    })
  }
}

// ============================================================================
// SCHEMA COMPONENTS
// ============================================================================

export const EnhancedJsonLD: React.FC<{ data: any; id?: string }> = ({ data, id }) => (
  <script
    id={id}
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(data, null, process.env.NODE_ENV === 'development' ? 2 : 0)
    }}
  />
)

export const EnhancedCourseSchemaComponent: React.FC<{ course: EnhancedCourseData }> = ({ course }) => (
  <EnhancedJsonLD data={generateEnhancedCourseSchema(course)} id="course-schema" />
)

export const EnhancedQuizSchemaComponent: React.FC<{ quiz: EnhancedQuizData }> = ({ quiz }) => (
  <EnhancedJsonLD data={generateEnhancedQuizSchema(quiz)} id="quiz-schema" />
)

export const EnhancedWebsiteSchemaComponent: React.FC = () => (
  <EnhancedJsonLD data={generateEnhancedWebsiteSchema()} id="website-schema" />
)

export const EnhancedOrganizationSchemaComponent: React.FC = () => (
  <EnhancedJsonLD data={generateEnhancedOrganizationSchema()} id="organization-schema" />
)

export const EnhancedFAQSchemaComponent: React.FC<{ faqs?: typeof defaultFAQItems }> = ({ faqs }) => (
  <EnhancedJsonLD data={generateEnhancedFAQSchema(faqs)} id="faq-schema" />
)

export const EnhancedBreadcrumbSchemaComponent: React.FC<{
  path: string
  customItems?: Array<{ name: string; url: string }>
}> = ({ path, customItems }) => (
  <EnhancedJsonLD data={generateEnhancedBreadcrumbSchema(path, customItems)} id="breadcrumb-schema" />
)

// ============================================================================
// COMPREHENSIVE SEO PROVIDER
// ============================================================================

export interface SEOProviderProps {
  children: React.ReactNode
  enableWebsite?: boolean
  enableOrganization?: boolean
  enableFAQ?: boolean
  enableBreadcrumbs?: boolean
  currentPath?: string
  customFAQs?: typeof defaultFAQItems
  customBreadcrumbs?: Array<{ name: string; url: string }>
}

export const EnhancedSEOProvider: React.FC<SEOProviderProps> = ({
  children,
  enableWebsite = true,
  enableOrganization = true,
  enableFAQ = false,
  enableBreadcrumbs = false,
  currentPath = '/',
  customFAQs,
  customBreadcrumbs
}) => {
  return (
    <>
      {enableWebsite && <EnhancedWebsiteSchemaComponent />}
      {enableOrganization && <EnhancedOrganizationSchemaComponent />}
      {enableFAQ && <EnhancedFAQSchemaComponent faqs={customFAQs} />}
      {enableBreadcrumbs && (
        <EnhancedBreadcrumbSchemaComponent
          path={currentPath}
          customItems={customBreadcrumbs}
        />
      )}
      {children}
    </>
  )
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export function validateSchemaCompliance(schema: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!schema['@context']) errors.push('Missing @context')
  if (!schema['@type']) errors.push('Missing @type')
  
  // Course-specific validations
  if (schema['@type'] === 'Course') {
    if (!schema.hasCourseInstance) errors.push('Course missing required hasCourseInstance')
    if (!schema.provider || !schema.provider.name) errors.push('Course missing provider information')
    if (!schema.offers) errors.push('Course missing offers information')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export default {
  generateEnhancedCourseSchema,
  generateEnhancedQuizSchema,
  generateEnhancedFAQSchema,
  generateEnhancedWebsiteSchema,
  generateEnhancedOrganizationSchema,
  generateEnhancedBreadcrumbSchema,
  generateEnhancedMetadata,
  EnhancedSEOProvider,
  validateSchemaCompliance
}
