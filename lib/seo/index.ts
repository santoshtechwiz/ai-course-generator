/**
 * Enhanced SEO Module for CourseAI Platform
 * 
 * Comprehensive SEO system that addresses Google Search Console issues
 * and provides complete schema.org compliance for better search visibility.
 */

// ============================================================================
// CORE EXPORTS
// ============================================================================

// Constants and configuration
export { BASE_URL, defaultSiteInfo, defaultFAQItems } from "./constants";

// Core utility functions
export {
  extractKeywords,
  generateMetaDescription,
  optimizeImageAlt,
  getSocialImageUrl,
  getQuizTypeLabel,
  getCourseDifficultyLabel,
  validateMetadata,
} from "./core-utils";

// Enhanced SEO system (primary - fixes Google Search Console issues)
export {
  generateEnhancedMetadata,
  generateEnhancedCourseSchema,
  generateEnhancedQuizSchema,
  generateEnhancedFAQSchema,
  generateEnhancedWebsiteSchema,
  generateEnhancedOrganizationSchema,
  generateEnhancedBreadcrumbSchema,
  EnhancedSEOProvider,
  EnhancedCourseSchemaComponent,
  EnhancedQuizSchemaComponent,
  EnhancedWebsiteSchemaComponent,
  EnhancedOrganizationSchemaComponent,
  EnhancedFAQSchemaComponent,
  EnhancedBreadcrumbSchemaComponent,
  validateSchemaCompliance,
  type EnhancedCourseData,
  type EnhancedQuizData,
  type EnhancedMetadataConfig,
} from "./enhanced-seo-system";

// Unified metadata generation (legacy support)
export {
  generateMetadata,
  generateCourseMetadata,
  generateQuizMetadata,
  type MetadataConfig,
} from "./unified-metadata";

// React components (legacy support)
export { JsonLD, DefaultSEO } from "./components";

// Structured data components (legacy support)
export {
  WebsiteSchema,
  BreadcrumbListSchema,
  OrganizationSchema,
  FAQSchema,
  CourseSchema,
  QuizSchema,
} from "./components";

// ============================================================================
// LEGACY SUPPORT (for backward compatibility)
// ============================================================================

// Re-export enhanced functions with legacy names
export { generateEnhancedMetadata as generateOptimizedMetadata } from "./enhanced-seo-system";

// ============================================================================
// TYPE EXPORTS
// ============================================================================

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
} from "./seo-schema";

// ============================================================================
// DEFAULT METADATA
// ============================================================================

import { generateMetadata } from "./unified-metadata";
import { defaultSiteInfo } from "./constants";

export const defaultMetadata = generateMetadata({
  title: defaultSiteInfo.name || "CourseAI",
  description: "AI-powered learning platform with interactive courses, quizzes, and personalized education tools",
  keywords: ["AI", "learning", "education", "courses", "quizzes", "programming", "coding"],
});

// ============================================================================
// ENHANCED SEO SYSTEM
// ============================================================================

// Enhanced SEO System for Google Search Console compliance
export * from "./enhanced-seo-system-v2";
