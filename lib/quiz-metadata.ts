import type { Metadata } from "next"
import { generateQuizMetadata as generateSEOQuizMetadata } from "@/lib/seo"

/**
 * Simplified Quiz Metadata Generator
 * 
 * Uses the existing SEO system to generate metadata for quiz types
 * without creating redundant layout files
 */

export interface QuizMetadataOptions {
  quizType: "mcq" | "code" | "blanks" | "openended" | "flashcard" | "document"
  title?: string
  description?: string
  topic?: string
  difficulty?: "easy" | "medium" | "hard"
  category?: string
  questionCount?: number
  noIndex?: boolean
}

const quizTypeConfigs = {
  mcq: {
    name: "Multiple Choice Quiz",
    description: "Interactive multiple-choice questions with instant feedback",
    keywords: ["multiple choice", "MCQ", "quiz questions", "interactive assessment"]
  },
  code: {
    name: "Code Challenge",
    description: "Programming challenges and coding exercises",
    keywords: ["coding challenge", "programming test", "code quiz", "developer assessment"]
  },
  blanks: {
    name: "Fill in the Blanks",
    description: "Complete the missing words and test your knowledge",
    keywords: ["fill blanks", "completion test", "word quiz", "gap filling"]
  },
  openended: {
    name: "Open-Ended Questions",
    description: "Express your understanding with detailed written responses",
    keywords: ["open ended", "essay questions", "written assessment", "detailed answers"]
  },
  flashcard: {
    name: "Flashcards",
    description: "Quick study cards for effective memorization and review",
    keywords: ["flashcards", "study cards", "memory test", "quick review"]
  },
  document: {
    name: "Document Quiz",
    description: "Test your understanding of document content",
    keywords: ["document quiz", "reading comprehension", "content assessment"]
  }
}

/**
 * Generate dynamic metadata for quiz pages using existing SEO system
 */
export function generateQuizMetadata({
  quizType,
  title,
  description,
  topic,
  difficulty,
  category,
  questionCount,
  noIndex = true
}: QuizMetadataOptions): Metadata {
  const config = quizTypeConfigs[quizType]
  
  const dynamicTitle = title || 
    `${config.name}${topic ? ` - ${topic}` : ''}${difficulty ? ` (${difficulty})` : ''}`
  
  const dynamicDescription = description || 
    `${config.description}${topic ? ` on ${topic}` : ''}${questionCount ? `. ${questionCount} questions` : ''}.`

  // Use the existing SEO system with correct parameters
  const base = generateSEOQuizMetadata({
    title: dynamicTitle,
    description: dynamicDescription,
    slug: quizType, // Use quiz type as slug for now
    quizType: quizType,
    difficulty: difficulty,
    questionsCount: questionCount,
  })

  // Apply robots noindex when required (not-found/private)
  if (noIndex) {
    base.robots = { index: false, follow: true }
  }
  return base
}

/**
 * Generate structured data for quiz content
 */
export function generateQuizStructuredData({
  quizType,
  title,
  topic,
  questionCount,
  difficulty
}: QuizMetadataOptions) {
  const config = quizTypeConfigs[quizType]
  
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "name": title || `${config.name}${topic ? ` - ${topic}` : ''}`,
    "description": config.description,
    "educationalLevel": difficulty || "intermediate",
    "learningResourceType": "Quiz",
    "interactivityType": "active",
    ...(questionCount && { "numberOfQuestions": questionCount }),
    ...(topic && { "about": topic }),
    "provider": {
      "@type": "Organization",
      "name": "CourseAI"
    }
  }
}
