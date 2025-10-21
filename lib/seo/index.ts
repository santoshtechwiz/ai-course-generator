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
;
export const generateSEOMetadata=()=>{

  return {};  
}
// Core utility functions
;

// Unified metadata generation
export {
  generateMetadata,
  
  generateQuizMetadata,
  
} from "./unified-metadata";

// Quiz title utilities (SEO improvements)
;

// React components
export { JsonLD, DefaultSEO } from "./components";

// Structured data components
export {
  
  
  
  FAQSchema,
  
  QuizSchema,
} from "./components";

// ============================================================================
// TYPE EXPORTS
// ============================================================================
;

// ============================================================================
// DEFAULT METADATA
// ============================================================================

import { generateMetadata } from "./unified-metadata";
import { defaultSiteInfo } from "./constants";

const defaultMetadata = generateMetadata({
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
