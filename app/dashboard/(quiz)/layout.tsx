import type React from "react"
import { ModuleLayout } from "@/components/layout/ModuleLayout"
import type { Metadata } from "next"
import { generateMetadata as generateSEOMetadata } from "@/lib/seo"

/**
 * Quiz Module Layout
 *
 * Unified layout for all quiz-related pages with:
 * - Consistent spacing and styling
 * - Full-width responsive design
 * - SEO optimization for quiz discovery
 */

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

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ModuleLayout variant="default" className="quiz-module-layout">
      {children}
    </ModuleLayout>
  )
}
