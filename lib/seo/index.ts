/**
 * SEO Manager - Clean, optimized SEO utilities for CourseAI
 * Streamlined for better performance and maintainability
 */

// Core SEO components and utilities
export { JsonLD, DefaultSEO } from "./components";
export { defaultMetadata, BASE_URL, defaultSiteInfo } from "./constants";

// Primary SEO utilities (recommended)
export {
  generateOptimizedMetadata,
  cleanTitle,
  cleanDescription,
  optimizeKeywords,
  generateCleanStructuredData,
  validateMetadata
} from './optimized-seo-manager';

// Enhanced SEO utilities (advanced features)
export {
  generateEnhancedMetadata,
  optimizeTitle,
  optimizeDescription,
  generateEnhancedStructuredData,
  validateAndOptimizeMetadata,
  generateSitemapMetadata
} from './enhanced-seo-manager';

// Additional SEO components
export {
  WebsiteSchema,
  BreadcrumbListSchema,
  OrganizationSchema,
  FAQSchema,
  CourseSchema,
  QuizSchema
} from './components';

// Essential types for TypeScript support
export type {
  SiteInfo,
  BreadcrumbItem,
  FaqItem,
  JsonLdProps,
  BreadcrumbListProps,
  OrganizationProps,
  FAQProps,
  CourseSchemaProps,
  QuizSchemaProps,
  CombinedSchemaProps,
  MetadataOptions,
} from './seo-schema';

// SEO option types
export type { OptimizedSEOOptions } from './optimized-seo-manager';
export type { EnhancedSEOOptions } from './enhanced-seo-manager';
