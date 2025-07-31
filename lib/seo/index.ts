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
  extractKeywords,
  generateMetaDescription,
  optimizeImageAlt,
  generateJsonLd,
  generateMetadata
  
} from './helper-utils';




export {
  JsonLD,
  WebsiteSchema,
  BreadcrumbListSchema,
  OrganizationSchema,
  FAQSchema,
  CourseSchema,
  DefaultSEO,
  QuizSchema
} from './components';

// Export all types
export * from './types';
