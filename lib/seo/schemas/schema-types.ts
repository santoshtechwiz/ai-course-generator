/**
 * CourseAI Schema Types and Generators
 * Type definitions and generator classes for structured data
 */

import type { SEOConfig } from '../core/seo-service'

// ============================================================================
// SCHEMA TYPES
// ============================================================================

export interface BaseSchema {
  '@context': 'https://schema.org'
  '@type': string
  '@id'?: string
  [key: string]: any
}

export interface OrganizationSchema extends BaseSchema {
  '@type': 'Organization'
  name: string
  url: string
  logo?: string
  description?: string
  foundingDate?: string
  contactPoint?: {
    '@type': 'ContactPoint'
    contactType: string
    email?: string
    telephone?: string
  }
  sameAs?: string[]
}

export interface CourseSchema extends BaseSchema {
  '@type': 'Course'
  name: string
  description: string
  provider: {
    '@type': 'Organization'
    name: string
  }
  courseMode?: string
  educationalUse?: string
  teaches?: string[]
  hasCourseInstance?: {
    '@type': 'CourseInstance'
    courseMode: string
    instructor?: {
      '@type': 'Person'
      name: string
    }
  }
}

export interface QuizSchema extends BaseSchema {
  '@type': 'Quiz'
  name: string
  description: string
  about: {
    '@type': 'Thing'
    name: string
  }
  educationalUse?: string
  teaches?: string[]
}

export interface FAQSchema extends BaseSchema {
  '@type': 'FAQPage'
  mainEntity: Array<{
    '@type': 'Question'
    name: string
    acceptedAnswer: {
      '@type': 'Answer'
      text: string
    }
  }>
}

export interface BreadcrumbSchema extends BaseSchema {
  '@type': 'BreadcrumbList'
  itemListElement: Array<{
    '@type': 'ListItem'
    position: number
    name: string
    item: string
  }>
}

// ============================================================================
// SCHEMA GENERATORS
// ============================================================================

export class SchemaGenerator {
  private baseUrl: string
  private siteName: string

  constructor(baseUrl: string = 'https://courseai.io', siteName: string = 'CourseAI') {
    this.baseUrl = baseUrl
    this.siteName = siteName
  }

  /**
   * Generate organization schema
   */
  generateOrganization(overrides: Partial<OrganizationSchema> = {}): OrganizationSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: this.siteName,
      url: this.baseUrl,
      logo: `${this.baseUrl}/logo.png`,
      description: 'AI-powered educational platform for creating interactive courses and intelligent quizzes',
      foundingDate: '2024',
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'support@courseai.io',
      },
      sameAs: [
        'https://github.com/santoshtechwiz/ai-course-generator',
      ],
      ...overrides,
    }
  }

  /**
   * Generate course schema
   */
  generateCourse(course: {
    name: string
    description: string
    instructor?: string
    tags?: string[]
    url: string
  }): CourseSchema {
    if (!course || typeof course !== 'object') {
      throw new Error('Course data must be a valid object')
    }
    if (!course.name || !course.description || !course.url) {
      throw new Error('Course must have name, description, and url')
    }
    return {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: course.name,
      description: course.description,
      provider: {
        '@type': 'Organization',
        name: this.siteName,
      },
      courseMode: 'online',
      educationalUse: 'professional development',
      teaches: course.tags || [],
      hasCourseInstance: {
        '@type': 'CourseInstance',
        courseMode: 'online',
        ...(course.instructor && {
          instructor: {
            '@type': 'Person',
            name: course.instructor,
          },
        }),
      },
    }
  }

  /**
   * Generate quiz schema
   */
  generateQuiz(quiz: {
    name: string
    description: string
    category?: string
    tags?: string[]
  }): QuizSchema {
    if (!quiz || typeof quiz !== 'object') {
      throw new Error('Quiz data must be a valid object')
    }
    if (!quiz.name || !quiz.description) {
      throw new Error('Quiz must have name and description')
    }
    return {
      '@context': 'https://schema.org',
      '@type': 'Quiz',
      name: quiz.name,
      description: quiz.description,
      about: {
        '@type': 'Thing',
        name: quiz.category || 'Education',
      },
      educationalUse: 'assessment',
      teaches: quiz.tags || [],
    }
  }

  /**
   * Generate FAQ schema
   */
  generateFAQ(faqs: Array<{ question: string; answer: string }>): FAQSchema {
    if (!faqs || !Array.isArray(faqs) || faqs.length === 0) {
      throw new Error('FAQ data must be a non-empty array')
    }
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    }
  }

  /**
   * Generate breadcrumb schema
   */
  generateBreadcrumb(items: Array<{ name: string; url: string }>): BreadcrumbSchema {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Breadcrumb items must be a non-empty array')
    }
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url.startsWith('http') ? item.url : `${this.baseUrl}${item.url}`,
      })),
    }
  }

  /**
   * Generate article schema
   */
  generateArticle(article: {
    headline: string
    description: string
    image?: string
    datePublished: string
    dateModified?: string
    author?: string
    url: string
  }): BaseSchema {
    if (!article || typeof article !== 'object') {
      throw new Error('Article data must be a valid object')
    }
    if (!article.headline || !article.description || !article.datePublished || !article.url) {
      throw new Error('Article must have headline, description, datePublished, and url')
    }
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.headline,
      description: article.description,
      image: article.image || `${this.baseUrl}/og-image.jpg`,
      datePublished: article.datePublished,
      dateModified: article.dateModified || article.datePublished,
      author: article.author ? {
        '@type': 'Person',
        name: article.author,
      } : {
        '@type': 'Organization',
        name: this.siteName,
      },
      publisher: {
        '@type': 'Organization',
        name: this.siteName,
        logo: {
          '@type': 'ImageObject',
          url: `${this.baseUrl}/logo.png`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': article.url,
      },
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create schema generator instance
 */
export function createSchemaGenerator(baseUrl?: string, siteName?: string): SchemaGenerator {
  return new SchemaGenerator(baseUrl, siteName)
}

/**
 * Validate schema structure
 */
export function validateSchema(schema: BaseSchema): boolean {
  return Boolean(
    schema['@context'] === 'https://schema.org' &&
    schema['@type'] &&
    typeof schema['@type'] === 'string'
  )
}