/**
 * SEO Module - Streamlined and Efficient
 * 
 * Consolidated SEO utilities for the CourseAI platform.
 * This module provides all essential SEO functionality in a clean, maintainable way.
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

// Unified metadata generation (primary)
export {
  generateMetadata,
  generateCourseMetadata,
  generateQuizMetadata,
  type MetadataConfig,
} from "./unified-metadata";

// React components
export { JsonLD, DefaultSEO } from "./components";

// Structured data components
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

// Re-export some functions with their original names
export { generateMetadata as generateOptimizedMetadata } from "./unified-metadata";

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
