import type { Metadata } from "next"
import { generateQuizPageMetadata } from "@/components/seo/QuizPageWrapper"
import FlashcardQuizClient from "./FlashcardQuizClient"

interface FlashcardQuizPageProps {
  params: Promise<{ slug: string }>
}

// Server component that generates proper SEO metadata
export async function generateMetadata({ params }: FlashcardQuizPageProps): Promise<Metadata> {
  const { slug } = await params
  
  // Create better SEO title without raw slug
  const cleanTopic = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  return generateQuizPageMetadata({
    quizType: "flashcard",
    slug,
    title: `${cleanTopic} - Study Flashcards`,
    description: `Master ${cleanTopic} concepts with interactive flashcards. Study key terms, definitions, and important facts with spaced repetition learning.`,
    topic: cleanTopic
  })
}

export default function FlashcardQuizPage({ params }: FlashcardQuizPageProps) {
  return <FlashcardQuizClient params={params} />
}
