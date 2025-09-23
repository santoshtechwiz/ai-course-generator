import type { Metadata } from "next"
import { generateMetadata as generateSEOMetadata } from "@/lib/seo"

/**
 * Quiz SEO Configuration
 * 
 * Provides standardized SEO metadata for different quiz types
 * with proper keywords, descriptions, and structured data
 */

export interface QuizSEOConfig {
  title: string
  description: string
  keywords: string[]
  canonical?: string
  type?: "website" | "article"
  structuredData?: object
}

const baseQuizKeywords = [
  "interactive quiz",
  "online assessment",
  "learning platform",
  "skill evaluation",
  "courseai",
  "knowledge test",
  "educational quiz",
  "practice test",
  "AI quiz generator",
  "personalized learning"
]

export const quizSEOConfigs: Record<string, QuizSEOConfig> = {
  mcq: {
    title: "Multiple Choice Quizzes – Test Your Knowledge | CourseAI",
    description: "Challenge yourself with interactive multiple-choice quizzes. Perfect for quick knowledge assessment and skill validation across various topics.",
    keywords: [
      "multiple choice quiz",
      "MCQ test",
      "interactive assessment",
      "quiz questions",
      "knowledge evaluation",
      "quick assessment",
      "instant feedback",
      ...baseQuizKeywords
    ],
    structuredData: {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "Assessment",
      "educationalLevel": "Any"
    }
  },
  
  openended: {
    title: "Open-Ended Questions – Express Your Understanding | CourseAI", 
    description: "Demonstrate deep understanding with open-ended questions that encourage critical thinking and detailed responses.",
    keywords: [
      "open ended questions",
      "essay questions",
      "critical thinking",
      "detailed assessment",
      "written evaluation",
      "comprehensive answers",
      "analytical skills",
      ...baseQuizKeywords
    ],
    structuredData: {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "Essay Assessment",
      "educationalLevel": "Advanced"
    }
  },
  
  code: {
    title: "Coding Challenges – Master Programming Skills | CourseAI",
    description: "Enhance your programming abilities with interactive coding challenges and real-world problem-solving exercises.",
    keywords: [
      "coding quiz",
      "programming challenges",
      "code assessment",
      "algorithm practice",
      "programming test",
      "software development",
      "coding skills",
      "developer assessment",
      "technical interview prep",
      ...baseQuizKeywords
    ],
    structuredData: {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "Technical Assessment",
      "educationalLevel": "Professional"
    }
  },
  
  flashcard: {
    title: "Digital Flashcards – Memorize and Learn Effectively | CourseAI",
    description: "Master concepts with interactive digital flashcards designed for efficient memorization and spaced repetition learning.",
    keywords: [
      "digital flashcards",
      "memory cards",
      "spaced repetition",
      "memorization tool",
      "study cards",
      "review system",
      "active recall",
      "memory training",
      ...baseQuizKeywords
    ],
    structuredData: {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "Memory Training",
      "educationalLevel": "Any"
    }
  },
  
  blanks: {
    title: "Fill in the Blanks – Complete Your Knowledge | CourseAI",
    description: "Test your understanding with fill-in-the-blank exercises that reinforce key concepts and terminology.",
    keywords: [
      "fill in the blanks",
      "completion test",
      "gap filling",
      "vocabulary quiz",
      "concept reinforcement",
      "terminology test",
      "knowledge gaps",
      ...baseQuizKeywords
    ],
    structuredData: {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "Completion Assessment",
      "educationalLevel": "Intermediate"
    }
  },
  
  document: {
    title: "Document-Based Quizzes – Learn from Content | CourseAI",
    description: "Generate quizzes from your documents and learn interactively from your own content and materials.",
    keywords: [
      "document quiz",
      "content-based assessment",
      "custom quiz",
      "document learning",
      "personalized quiz",
      "AI content analysis",
      "custom learning materials",
      ...baseQuizKeywords
    ],
    structuredData: {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "Custom Assessment",
      "educationalLevel": "Any"
    }
  }
}

export function generateQuizMetadata(
  quizType: keyof typeof quizSEOConfigs,
  overrides?: Partial<QuizSEOConfig>
): Metadata {
  const config = quizSEOConfigs[quizType]
  
  if (!config) {
    throw new Error(`Unknown quiz type: ${quizType}`)
  }
  
  const finalConfig = { ...config, ...overrides }
  
  return generateSEOMetadata({
    title: finalConfig.title,
    description: finalConfig.description,
    keywords: finalConfig.keywords,
    canonical: finalConfig.canonical || `/dashboard/${quizType}`,
    type: finalConfig.type || "website",
    noIndex: true, // Dashboard pages should not be indexed
  })
}

/**
 * Generate structured data for quiz instances
 */
export function generateQuizStructuredData(
  quizType: keyof typeof quizSEOConfigs,
  quizTitle: string,
  quizDescription?: string
) {
  const config = quizSEOConfigs[quizType]
  
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "name": quizTitle,
    "description": quizDescription || config.description,
    "educationalUse": "assessment",
    "learningResourceType": "Quiz",
    "interactivityType": "active",
    "typicalAgeRange": "13-99",
    "inLanguage": "en",
    "provider": {
      "@type": "Organization",
      "name": "CourseAI",
      "url": "https://courseai.io"
    },
    ...config.structuredData
  }
}
