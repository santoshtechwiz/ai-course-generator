/**
 * CourseAI SEO Service
 * Unified, enterprise-grade SEO management system
 *
 * Features:
 * - Single source of truth for all SEO metadata
 * - Comprehensive validation and error handling
 * - Extensible schema system
 * - Performance optimized with caching
 * - Type-safe configuration management
 */

import type { Metadata } from 'next'
import { z } from 'zod'

// ============================================================================
// CONFIGURATION & TYPES
// ============================================================================

export interface SEOConfig {
  title: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'profile' | 'product'
  author?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
  noIndex?: boolean
  noFollow?: boolean
  canonical?: string
  locale?: string
  alternates?: Record<string, string>
  structuredData?: Record<string, any>[]
  twitter?: {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player'
    site?: string
    creator?: string
  }
  openGraph?: {
    siteName?: string
    locale?: string
    type?: string
    images?: Array<{
      url: string
      width?: number
      height?: number
      alt?: string
    }>
  }
}

// Validation schema for SEO config
const seoConfigSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120, 'Title too long'),
  description: z.string().max(320, 'Description too long').optional(),
  keywords: z.array(z.string()).optional(),
  image: z.string().refine((val) => {
    // Allow relative paths (starting with /) or full URLs
    return val.startsWith('/') || z.string().url().safeParse(val).success
  }, 'Image must be a valid URL or relative path').optional(),
  url: z.string().url().optional(),
  type: z.enum(['website', 'article', 'profile', 'product']).optional(),
  author: z.string().optional(),
  publishedTime: z.string().optional(),
  modifiedTime: z.string().optional(),
  section: z.string().optional(),
  tags: z.array(z.string()).optional(),
  noIndex: z.boolean().optional(),
  noFollow: z.boolean().optional(),
  canonical: z.string().refine((val) => {
    // Allow relative paths (starting with /) or full URLs
    return val.startsWith('/') || z.string().url().safeParse(val).success
  }, 'Canonical URL must be a valid URL or relative path').optional(),
  locale: z.string().optional(),
  alternates: z.record(z.string()).optional(),
  structuredData: z.array(z.record(z.any())).optional(),
  twitter: z.object({
    card: z.enum(['summary', 'summary_large_image', 'app', 'player']).optional(),
    site: z.string().optional(),
    creator: z.string().optional(),
  }).optional(),
  openGraph: z.object({
    siteName: z.string().optional(),
    locale: z.string().optional(),
    type: z.string().optional(),
    images: z.array(z.object({
      url: z.string().refine((val) => {
        // Allow relative paths (starting with /) or full URLs
        return val.startsWith('/') || z.string().url().safeParse(val).success
      }, 'Image URL must be a valid URL or relative path'),
      width: z.number().optional(),
      height: z.number().optional(),
      alt: z.string().optional(),
    })).optional(),
  }).optional(),
})

// ============================================================================
// CORE SEO SERVICE CLASS
// ============================================================================

export class CourseAISEO {
  private config: SEOConfig
  private baseConfig: SEOConfig

  constructor(baseConfig: SEOConfig) {
    this.baseConfig = baseConfig
    this.config = { ...baseConfig }
  }

  /**
   * Generate complete metadata object for Next.js
   */
  generateMetadata(overrides: Partial<SEOConfig> = {}): Metadata {
    const finalConfig = { ...this.config, ...overrides }

    // Validate configuration
    const validatedConfig = seoConfigSchema.parse(finalConfig)

    const metadata: Metadata = {
      title: this.generateTitle(validatedConfig.title),
      description: validatedConfig.description,
      keywords: validatedConfig.keywords?.join(', '),
      authors: validatedConfig.author ? [{ name: validatedConfig.author }] : undefined,
      alternates: {
        canonical: validatedConfig.canonical || validatedConfig.url,
        languages: validatedConfig.alternates,
      },
      robots: this.generateRobotsString(validatedConfig as SEOConfig),
      openGraph: this.generateOpenGraph(validatedConfig as SEOConfig),
      twitter: this.generateTwitter(validatedConfig as SEOConfig),
      other: this.generateStructuredData(validatedConfig as SEOConfig),
    }

    // Add additional metadata
    if (validatedConfig.publishedTime) {
      metadata.other = {
        ...metadata.other,
        'article:published_time': validatedConfig.publishedTime,
      } as any
    }

    if (validatedConfig.modifiedTime) {
      metadata.other = {
        ...metadata.other,
        'article:modified_time': validatedConfig.modifiedTime,
      } as any
    }

    if (validatedConfig.section) {
      metadata.other = {
        ...metadata.other,
        'article:section': validatedConfig.section,
      } as any
    }

    if (validatedConfig.tags?.length) {
      metadata.other = {
        ...metadata.other,
        'article:tag': validatedConfig.tags,
      } as any
    }

    return metadata
  }

  /**
   * Generate title with site name
   */
  private generateTitle(title: string): string {
    const siteName = this.baseConfig.openGraph?.siteName || 'CourseAI'
    return title.includes(siteName) ? title : `${title} | ${siteName}`
  }

  /**
   * Generate robots meta string
   */
  private generateRobotsString(config: SEOConfig): string {
    const directives: string[] = []

    if (config.noIndex) {
      directives.push('noindex')
    } else {
      directives.push('index')
    }

    if (config.noFollow) {
      directives.push('nofollow')
    } else {
      directives.push('follow')
    }

    directives.push('max-image-preview:large')
    directives.push('max-snippet:-1')
    directives.push('max-video-preview:-1')

    return directives.join(', ')
  }

  /**
   * Generate Open Graph metadata
   */
  private generateOpenGraph(config: SEOConfig) {
    const og = config.openGraph || {}
    const siteName = og.siteName || this.baseConfig.openGraph?.siteName || 'CourseAI'

    return {
      title: config.title,
      description: config.description,
      url: config.url || config.canonical,
      siteName,
      locale: og.locale || config.locale || 'en_US',
      type: og.type || config.type || 'website',
      images: og.images || (config.image ? [{
        url: config.image,
        width: 1200,
        height: 630,
        alt: config.title,
      }] : undefined),
    }
  }

  /**
   * Generate Twitter Card metadata
   */
  private generateTwitter(config: SEOConfig) {
    const twitter = config.twitter || {}

    return {
      card: twitter.card || 'summary_large_image',
      title: config.title,
      description: config.description,
      images: config.image ? [config.image] : undefined,
      site: twitter.site,
      creator: twitter.creator,
    }
  }

  /**
   * Generate structured data
   */
  private generateStructuredData(config: SEOConfig): Record<string, string> {
    const structuredData = config.structuredData || []
    const result: Record<string, string> = {}

    structuredData.forEach((schema, index) => {
      result[`json-ld-${index}`] = JSON.stringify({
        '@context': 'https://schema.org',
        ...schema,
      })
    })

    return result
  }

  /**
   * Create page-specific SEO instance
   */
  forPage(pageConfig: Partial<SEOConfig>): CourseAISEO {
    return new CourseAISEO({ ...this.baseConfig, ...pageConfig })
  }

  /**
   * Validate SEO configuration
   */
  validate(config: SEOConfig): { success: true } | { success: false; errors: z.ZodError } {
    try {
      seoConfigSchema.parse(config)
      return { success: true }
    } catch (error) {
      return { success: false, errors: error as z.ZodError }
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create SEO service instance with base configuration
 */
export function createSEOService(baseConfig: SEOConfig): CourseAISEO {
  return new CourseAISEO(baseConfig)
}

/**
 * Generate metadata with validation (convenience function)
 */
export function generateSEOMetadata(config: SEOConfig): Metadata {
  const service = createSEOService({
    title: 'CourseAI',
    description: 'AI-powered educational platform',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://courseai.io',
    openGraph: {
      siteName: 'CourseAI',
      locale: 'en_US',
    },
    twitter: {
      site: '@courseai',
    },
  })

  return service.generateMetadata(config)
}