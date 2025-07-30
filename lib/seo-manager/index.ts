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
  defaultSocialProfiles,
  defaultMetadata
} from './config';

// Export SEO utility functions
export {
  generateSeoMetadata,
  generateCourseStructuredData,
  generateQuizStructuredData,
  extractKeywords,
  generateMetaDescription,
  optimizeImageAlt,
  generateJsonLd,
  getSocialImageUrl,
  createBreadcrumbItems,
  generateBreadcrumbs,
  createSocialProfiles,
  getQuizTypeLabel,
} from './helper-utils';

// Export generateMetadata for Next.js pages
export { generateMetadata } from './helper-utils';

export {
  JsonLD,
  JsonLd,
  WebsiteSchema,
  BreadcrumbListSchema,
  OrganizationSchema,
  FAQSchema,

  CourseSchema,
  DefaultSEO
} from './components';

// Export all types
export * from './types';


