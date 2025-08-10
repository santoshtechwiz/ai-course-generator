import type { Metadata } from "next"
import { generateQuizPageMetadata } from "@/components/seo/QuizPageWrapper"
import OpenEndedQuizClient from "./OpenEndedQuizClient"

interface OpenEndedQuizPageProps {
  params: Promise<{ slug: string }>
}

// Server component that generates proper SEO metadata
export async function generateMetadata({ params }: OpenEndedQuizPageProps): Promise<Metadata> {
  const { slug } = await params
  
  // Create better SEO title without raw slug
  const cleanTopic = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  return generateQuizPageMetadata({
    quizType: "openended",
    slug,
    title: `${cleanTopic} - Essay Questions & Analysis`,
    description: `Deepen your understanding of ${cleanTopic} with comprehensive essay questions. Practice critical thinking and detailed written responses with expert feedback.`,
    topic: cleanTopic
  })
}

export default function OpenEndedQuizPage({ params }: OpenEndedQuizPageProps) {
  return <OpenEndedQuizClient params={params} />
}
