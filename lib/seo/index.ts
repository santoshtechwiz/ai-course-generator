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
export const generateSEOMetadata=()=>{

  return {};  
}
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
  title: defaultSiteInfo.name || "CourseAI - AI-Powered Educational Platform",
  description: "Create engaging courses and interactive quizzes with AI. CourseAI transforms text, videos, and ideas into comprehensive learning experiences. Perfect for educators, trainers, and content creators.",
  keywords: [
    "AI education platform", 
    "course creation", 
    "interactive learning", 
    "quiz generator", 
    "educational technology", 
    "e-learning", 
    "AI-powered courses", 
    "video tutorials", 
    "online education", 
    "skill development",
    "professional training",
    "courseai",
    "course builder",
    "learning management",
    "educational content",
    "personalized learning",
    "coding courses",
    "programming tutorials",
    "tech education"
  ]
});
