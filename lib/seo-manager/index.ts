/**
 * SEO Manager - Main export file
 * 
 * This file exports all components, functions, and types from the SEO Manager.
 * It serves as the main entry point for the SEO Manager module.
 */

// Export types
export * from './types';

// Export constants and defaults
export { 
  defaultMetadata, 
  defaultSiteInfo, 
  defaultSocialProfiles,
  defaultFAQItems
} from './constants';

// Export metadata functions
export { 
  generateMetadata, 
  generatePageMetadata, 
  generateDynamicMetadata,
  generateQuizMetadata,
  generateCourseMetadata
} from './metadata';

// Export schema generators
export { 
  generateWebsiteSchema,
  generateWebApplicationSchema,
  generateSoftwareApplicationSchema,
  generateOrganizationSchema,
  generateBreadcrumbSchema,
  generateArticleSchema,
  generateCourseSchema,
  generateQuizSchema,
  generateFAQSchema,
  generateHowToSchema,
  generatePricingSchema,
  generatePersonSchema,
  generateVideoSchema,
  SchemaRegistry,
  SchemaRegistryService,
  schemaRegistry
} from './schema';

// Export React components
export {
  JsonLD,
  JsonLd,
  WebsiteSchema,
  BreadcrumbListSchema,
  OrganizationSchema,
  FAQSchema,
  CourseSchema,
  CombinedSEOSchema,
  DefaultSEO
} from './components';

// Export utility functions
export {
  extractKeywords,
  generateMetaDescription,
  optimizeImageAlt,
  generateJsonLd,
  getSocialImageUrl,
  generateBreadcrumbItemsFromPath,
  createBreadcrumbItems,
  createSocialProfiles,
  generateSocialImage
} from './utils';
