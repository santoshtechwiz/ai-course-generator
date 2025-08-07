import type React from "react"
import type { Metadata } from "next"
import { ModuleLayout } from "@/components/layout/ModuleLayout"
import { generateQuizMetadata } from "@/lib/quiz-metadata"

/**
 * Dynamic Flashcard Instance Layout
 * 
 * Provides dynamic SEO for individual flashcard quiz instances
 * using the unified quiz metadata system
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
  return (
    <ModuleLayout 
      variant="flush" 
      suspense={true} 
      className="flashcard-quiz-instance-layout w-full min-h-screen p-0 m-0"
    >
      {children}
    </ModuleLayout>
  )
}
