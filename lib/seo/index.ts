// Re-export key SEO components and constants for app-wide imports
export { JsonLD, DefaultSEO } from "./components";
export { defaultMetadata } from "./constants";


// ============================================================================
// TYPE EXPORTS

import { SEO_CONFIG, defaultSiteInfo } from "./constants"
import { metadataGenerator } from "./metadata-generator"
import { schemaFactory } from "./schema-factory"

// ============================================================================
export type {
  // Schema types
  BaseSchema,
  WebSiteSchema,
  BreadcrumbListSchema,
  FAQPageSchema,
  CourseSchema as CourseSchemaType,
  QuizSchema as QuizSchemaType,
  ArticleSchema as ArticleSchemaType,
  ProductSchema as ProductSchemaType,
  EventSchema as EventSchemaType,
  VideoObjectSchema,
  HowToSchema,
  Organization,
  Person,
  ImageObject,
  PostalAddress,
  ContactPoint,
  OpeningHoursSpecification,
  Offer,
  AggregateRating,
  Review,
  Rating,
  // Component prop types
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
  // Factory types
  SchemaType,
  SchemaFactoryConfig,
} from "./seo-schema"

// ============================================================================
// ENHANCED COMPONENT PROP TYPES
// ============================================================================
export type {
  WebsiteSchemaProps,
  BreadcrumbListSchemaProps,
  OrganizationSchemaProps,
  EnhancedCourseSchemaProps,
  EnhancedQuizSchemaProps,
  EnhancedDefaultSEOProps,
  ArticleSchemaProps,
  ProductSchemaProps,
  EventSchemaProps,
  VideoSchemaProps,
} from "./components"

export type { AdvancedMetadataOptions } from "./metadata-generator"

// ============================================================================
// VERSION AND METADATA
// ============================================================================
export const SEO_MANAGER_VERSION = "2.0.0"
export const SEO_MANAGER_NAME = "Enhanced SEO Manager"
export const SEO_MANAGER_DESCRIPTION = "Comprehensive SEO management system with Google Schema compliance"

// ============================================================================
// DEFAULT EXPORT
// ============================================================================
export default {
  // Core instances
  schemaFactory,
  metadataGenerator,

  // Configuration
  config: SEO_CONFIG,
  siteInfo: defaultSiteInfo,

  // Version info
  version: SEO_MANAGER_VERSION,
  name: SEO_MANAGER_NAME,
  description: SEO_MANAGER_DESCRIPTION,
}
