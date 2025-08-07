import type React from "react"
import { ModuleLayout } from "@/components/layout/ModuleLayout"
import type { Metadata } from "next"
import { generateMetadata as generateSEOMetadata } from "@/lib/seo"

/**
 * Unified Quiz Module Layout
 * 
 * Single layout for all quiz types with dynamic SEO support:
 * - Consistent spacing and styling for all quiz components
 * - Full-width responsive design
 * - Dynamic metadata that can be overridden by page components
 * - Eliminates need for multiple layout files per quiz type
 */

export const metadata: Metadata = generateSEOMetadata({
  title: "Interactive Quizzes – Test Your Knowledge | CourseAI",
  description: 
    "Challenge yourself with our comprehensive collection of interactive quizzes. From multiple-choice to coding challenges, enhance your learning journey with AI-powered assessments.",
  keywords: [
    "interactive quizzes",
    "knowledge testing", 
    "learning assessment",
    "quiz platform",
    "skill evaluation",
    "courseai quizzes",
    "mcq quiz",
    "coding challenges", 
    "flashcards",
    "fill in the blanks",
    "open ended questions",
    "educational assessment",
    "practice tests",
    "AI generated quizzes"
  ],
  noIndex: true, // Dashboard content should not be indexed
})

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ModuleLayout variant="flush" suspense={true} className="quiz-module-layout w-full min-h-screen p-0 m-0">
      {children}
    </ModuleLayout>
  )
}
