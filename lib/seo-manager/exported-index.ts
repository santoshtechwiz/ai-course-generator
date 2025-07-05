/**
 * SEO Manager - Centralized SEO utilities for CourseAI
 * 
 * This module provides tools for managing metadata and structured data across the application.
 */

// Export base configuration
export {
  BASE_URL,
  defaultSiteInfo,
  defaultFAQItems,
  socialProfiles,
  defaultMetadata
} from './config';

// Export metadata generators
export {
  generateMetadata,
  generatePageMetadata,
  generateDynamicMetadata,
  generateQuizMetadata,
  generateCourseMetadata,
  generateSocialImage
} from './meta-generators';

// Export utility functions
export {
  extractKeywords,
  generateMetaDescription,
  optimizeImageAlt,
  generateJsonLd,
  getSocialImageUrl,
  createBreadcrumbItems,
  generateBreadcrumbs,
  createSocialProfiles,
  getQuizTypeLabel
} from './helper-utils';

// Export React components for structured data
export {
  JsonLD,
  JsonLd,
  WebsiteSchema,
  BreadcrumbListSchema,
  OrganizationSchema,
  FAQSchema,
  CombinedSEOSchema,
  CourseSchema,
  QuizSchema,
  DynamicBreadcrumbSchema
} from './structured-data/components';

// Export schema generators
export { SchemaRegistry } from './structured-data/generators';

// Export types
export * from './structured-data/types';

/**
 * Default SEO component for all pages
 * Includes WebSite, BreadcrumbList, and Organization schemas
 */
export { DefaultSEO } from './seo-components';
