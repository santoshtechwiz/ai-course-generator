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
  const likelyInvalid = slug.length < 3 || /[^a-z0-9-]/i.test(slug)

  return generateQuizPageMetadata({
    quizType: "openended",
    slug,
    title: `${cleanTopic} - Open-Ended Quiz`,
    description: `Practice writing detailed responses about ${cleanTopic}. Get guidance and constructive feedback.`,
    topic: cleanTopic,
    noIndex: likelyInvalid
  })
}

export default function OpenEndedQuizPage({ params }: OpenEndedQuizPageProps) {
  return <OpenEndedQuizClient params={params} />
}
