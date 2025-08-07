import type { Metadata } from "next"
import { generateQuizMetadata } from "@/lib/quiz-metadata"

interface QuizPageWrapperProps {
  children: React.ReactNode
  quizType: "mcq" | "code" | "blanks" | "openended" | "flashcard" | "document"
  slug?: string
  title?: string
  description?: string
  topic?: string
  difficulty?: "easy" | "medium" | "hard"
  questionCount?: number
}

/**
 * Centralized Quiz Page Wrapper (Server Component)
 * 
 * This wrapper generates proper SEO metadata on the server side
 * and wraps quiz content. Use this instead of individual layout files.
 * 
 * Usage:
 * 1. Convert your quiz pages to server components
 * 2. Wrap content with this component
 * 3. Pass quiz metadata as props
 */

export function generateQuizPageMetadata({
  quizType,
  slug,
  title,
  description,
  topic,
  difficulty,
  questionCount
}: Omit<QuizPageWrapperProps, 'children'>): Metadata {
  
  // Extract topic from slug if not provided
  const derivedTopic = topic || (slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : undefined)
  
  return generateQuizMetadata({
    quizType,
    title,
    description,
    topic: derivedTopic,
    difficulty,
    questionCount
  })
}

export function QuizPageWrapper({
  children,
  quizType,
  slug,
  title,
  description,
  topic,
  difficulty,
  questionCount
}: QuizPageWrapperProps) {
  return (
    <div className="quiz-page-wrapper" data-quiz-type={quizType}>
      {children}
    </div>
  )
}
