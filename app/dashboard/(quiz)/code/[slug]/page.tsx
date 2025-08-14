import type { Metadata } from "next"
import { generateQuizPageMetadata } from "@/components/seo/QuizPageWrapper"
import CodeQuizClient from "./CodeQuizClient"

interface CodeQuizPageProps {
  params: Promise<{ slug: string }>
}

// Server component that generates proper SEO metadata
export async function generateMetadata({ params }: CodeQuizPageProps): Promise<Metadata> {
  const { slug } = await params
  
  // Create better SEO title without raw slug
  const cleanTopic = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const likelyInvalid = slug.length < 3 || /[^a-z0-9-]/i.test(slug)
  
  return generateQuizPageMetadata({
    quizType: "code",
    slug,
    title: `${cleanTopic} - Programming Challenge`,
    description: `Master ${cleanTopic} programming concepts with hands-on coding challenges. Write, debug, and optimize code with real-time feedback and explanations.`,
    topic: cleanTopic,
    noIndex: likelyInvalid
  })
}

export default function CodeQuizPage({ params }: CodeQuizPageProps) {
  return <CodeQuizClient params={params} />
}
