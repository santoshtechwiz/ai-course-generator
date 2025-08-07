import type React from "react"
import type { Metadata } from "next"
import { ModuleLayout } from "@/components/layout/ModuleLayout"
import { generateQuizMetadata } from "@/lib/quiz-seo"

/**
 * Document-Based Quiz Layout
 * 
 * Dynamic SEO layout for document-generated quizzes with:
 * - Optimized metadata for content-based assessments
 * - Keywords focused on custom and personalized learning
 * - Layout designed for document upload and quiz generation
 */

export const metadata: Metadata = generateQuizMetadata("document", {
  canonical: "/dashboard/quiz/document",
})

export default function DocumentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ModuleLayout
      variant="default"
      suspense={true}
      className="document-quiz-layout flex flex-col min-h-screen w-full bg-background"
      contentClassName="flex-1 w-full"
    >
      {children}
    </ModuleLayout>
  )
}
