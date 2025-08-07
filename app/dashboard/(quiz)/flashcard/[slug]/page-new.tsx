import type { Metadata } from "next"
import { generateQuizPageMetadata } from "@/components/seo/QuizPageWrapper"
import FlashcardQuizClient from "./FlashcardQuizClient"

interface FlashcardQuizPageProps {
  params: Promise<{ slug: string }>
}

// Server component that generates proper SEO metadata
export async function generateMetadata({ params }: FlashcardQuizPageProps): Promise<Metadata> {
  const { slug } = await params
  
  return generateQuizPageMetadata({
    quizType: "flashcard",
    slug,
    title: `Flashcard Quiz: ${slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    description: "Study with interactive flashcards to reinforce your knowledge. Review key concepts and test your memory retention.",
    topic: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  })
}

export default function FlashcardQuizPage({ params }: FlashcardQuizPageProps) {
  return <FlashcardQuizClient params={params} />
}
