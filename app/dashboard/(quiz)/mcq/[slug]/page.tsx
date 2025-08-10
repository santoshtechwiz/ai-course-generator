import type { Metadata } from "next"
import { generateQuizPageMetadata } from "@/components/seo/QuizPageWrapper"
import McqQuizClient from "./McqQuizClient"

interface McqQuizPageProps {
  params: Promise<{ slug: string }>
}

// Server component that generates proper SEO metadata
export async function generateMetadata({ params }: McqQuizPageProps): Promise<Metadata> {
  const { slug } = await params
  
  // Try to get the actual quiz title from the database/cache first
  // For now, create a better title without using raw slug
  const cleanTopic = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  return generateQuizPageMetadata({
    quizType: "mcq",
    slug,
    title: `${cleanTopic} - Multiple Choice Quiz`,
    description: `Test your knowledge of ${cleanTopic} with interactive multiple choice questions. Get instant feedback and detailed explanations for each answer.`,
    topic: cleanTopic
  })
}

export default function McqQuizPage({ params }: McqQuizPageProps) {
  return <McqQuizClient params={params} />
}
