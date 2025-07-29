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

// Export metadata generators and utility functions (merged, no duplicates)
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
  getQuizTypeLabel
} from './helper-utils';
export {
  generateWebsiteSchema,
  generateCourseSchema,
  generateQuizSchema,
  generateFAQSchema,
  generateOrganizationSchema,
  generateBreadcrumbSchema,
  generateArticleSchema,
  generateWebApplicationSchema,
  generateSoftwareApplicationSchema,
  generateHowToSchema,
  generatePersonSchema,
  generateVideoSchema,
  SchemaRegistry
} from './generators';
export { generateSocialImage } from './social-image';

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
  DefaultSEO
} from './components';

// Export schema generators
// (SchemaRegistry already exported above)

// Export types
export * from './types';


