import type React from "react"
import type { Metadata } from "next"
import { generateQuizMetadata } from "@/lib/quiz-metadata"

/**
 * Dynamic Flashcard Instance Layout
 * 
 * Provides dynamic SEO for individual flashcard quiz instances.
 * This layout is intentionally minimal to avoid nesting with DashboardShell
 * since QuizPlayLayout provides its own complete UI structure.
 */

type FlashcardSlugLayoutParams = {
  params: Promise<{ slug: string }>
  children: React.ReactNode
}

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params
  
  // Convert slug to readable title
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  return generateQuizMetadata({
    quizType: "flashcard",
    title: `${title} Flashcard Quiz`,
    description: `Interactive flashcard quiz on ${title}. Master key concepts through spaced repetition and active recall techniques.`,
    topic: title,
    difficulty: "medium"
  })
}

export default async function FlashcardSlugLayout({
  params,
  children,
}: FlashcardSlugLayoutParams) {
  // Minimal layout that doesn't interfere with QuizPlayLayout
  // QuizPlayLayout provides its own complete UI structure
  return <>{children}</>
}
