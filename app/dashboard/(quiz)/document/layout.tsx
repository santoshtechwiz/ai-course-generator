import type React from "react"
import type { Metadata } from "next"
import { generateQuizMetadata } from "@/lib/quiz-seo"

/**
 * Document-Based Quiz Layout
 * 
 * Dynamic SEO layout for document-generated quizzes.
 * Minimal layout to avoid conflicts with QuizPlayLayout.
 */

export const metadata: Metadata = generateQuizMetadata("document", {
  canonical: "/dashboard/document",
})

export default function DocumentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Minimal layout that doesn't interfere with QuizPlayLayout
  return <>{children}</>
}
