/**
 * CourseAI SEO System
 * Unified, enterprise-grade SEO management system
 *
 * This module provides:
 * - Single source of truth for all SEO metadata
 * - Comprehensive validation and error handling
 * - Extensible schema system
 * - Performance optimized with caching
 * - Type-safe configuration management
 */

import { generateSEOMetadata } from './core/seo-service'

// ============================================================================
// CORE EXPORTS
// ============================================================================

export { CourseAISEO, createSEOService, generateSEOMetadata } from './core/seo-service'

// ============================================================================
// CONFIGURATION MANAGEMENT
// ============================================================================

export {
  baseSEOConfig,
  pageConfigs,
  getPageConfig,
  getCoursePageConfig,
  getQuizPageConfig,
  hasRequiredFields,
  isValidUrl,
  validateImage,
} from './config/seo-config'

// ============================================================================
// SCHEMA SYSTEM
// ============================================================================

export {
  SchemaGenerator,
  createSchemaGenerator,
  validateSchema,
} from './schemas/schema-types'

export {
  // React Components
  SchemaScript,
  OrganizationSchema,
  CourseSchema,
  QuizSchema,
  FAQSchema,
  BreadcrumbSchema,
  ArticleSchema,
} from './schemas/schema-components'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export {
  extractKeywords,
  generateMetaDescription,
  slugify,
  capitalize,
  isValidEmail,
  hasRequiredSEOFields,
  // Caching
  cacheMetadata,
  getCachedMetadata,
  cacheSchema,
  getCachedSchema,
  generateMetadataCacheKey,
  generateSchemaCacheKey,
  // Analytics
  trackSEOMetrics,
  validateSEOPractices,
} from './utils/seo-utils'

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { SEOConfig } from './core/seo-service'

// ============================================================================
// LEGACY COMPATIBILITY (will be removed in future versions)
// ============================================================================

import { SchemaScript, OrganizationSchema } from './schemas/schema-generator'

/**
 * @deprecated Use CourseAISEO service instead
 */
export const generateMetadata = generateSEOMetadata

/**
 * @deprecated Use pageConfigs and getPageConfig instead
 */
export const defaultSiteInfo = {
  name: 'CourseAI',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://courseai.io',
}

/**
 * @deprecated Use SchemaScript instead
 */
export const JsonLD = SchemaScript

/**
 * @deprecated Use OrganizationSchema instead
 */
export const DefaultSEO = OrganizationSchema

// ============================================================================
// CONSTANTS
// ============================================================================

export const SEO_CONSTANTS = {
  TITLE_MAX_LENGTH: 60,
  DESCRIPTION_MAX_LENGTH: 160,
  KEYWORDS_MAX_COUNT: 10,
  OG_IMAGE_WIDTH: 1200,
  OG_IMAGE_HEIGHT: 630,
  CACHE_TTL_METADATA: 5 * 60 * 1000, // 5 minutes
  CACHE_TTL_SCHEMA: 10 * 60 * 1000, // 10 minutes
} as const