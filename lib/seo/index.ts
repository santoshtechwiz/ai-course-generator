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

// Unified metadata generation
export {
  generateMetadata,
  generateCourseMetadata,
  generateQuizMetadata,
  type MetadataConfig,
} from "./unified-metadata";

// Quiz title utilities (SEO improvements)
export {
  generateQuizTitle,
  generateQuizDescription,
  getQuizTypeDescription,
  QUIZ_TYPE_DESCRIPTIONS,
} from "./quiz-title-utils";

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
