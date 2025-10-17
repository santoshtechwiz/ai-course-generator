import type React from "react"
import type { Metadata } from "next"
import { generateMetadata as generateSEOMetadata } from "@/lib/seo"
import { QuizErrorBoundary } from "./components/QuizErrorBoundary"

export const metadata: Metadata = generateSEOMetadata({
  title: "Interactive Quizzes – Master Your Knowledge | CourseAI",
  description:
    "Explore our comprehensive collection of interactive quizzes including multiple choice, coding challenges, flashcards, and more. Test your knowledge and enhance your learning journey.",
  keywords: [
    "interactive quizzes",
    "knowledge testing",
    "learning assessment",
    "coding challenges",
    "educational quizzes",
    "skill evaluation",
    "practice tests",
    "learning platform",
    "quiz collection",
    "study tools",
    "flashcards",
    "multiple choice",
    "open ended questions",
    "quiz app",
    "online quiz platform",
    "quiz builder",
    "CourseAI quizzes",
  ],
  noIndex: true, // Dashboard content should not be indexed
})

/**
 * Simplified Quiz Layout (Next.js Best Practice)
 * 
 * Minimal layout that only adds quiz-specific error handling.
 * DashboardLayout already provides:
 * - min-h-screen container
 * - main content area  
 * - Chatbot component
 * - Error boundaries
 * 
 * This layout only adds quiz-specific error boundary for graceful failure recovery.
 */
export default async function QuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QuizErrorBoundary>
      {children}
    </QuizErrorBoundary>
  )
}
