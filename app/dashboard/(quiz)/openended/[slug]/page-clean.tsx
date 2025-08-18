import type { Metadata } from "next"
import { generateQuizPageMetadata } from "@/components/seo/QuizPageWrapper"
import OpenEndedQuizClient from "./OpenEndedQuizClient"

interface OpenEndedQuizPageProps {
  params: Promise<{ slug: string }>
}

// Server component that generates proper SEO metadata
export async function generateMetadata({ params }: OpenEndedQuizPageProps): Promise<Metadata> {
  const { slug } = await params
  
  return generateQuizPageMetadata({
    quizType: "openended",
    slug,
    title: `Open-Ended Quiz: ${slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    description: "Practice with open-ended questions that require detailed written responses. Develop critical thinking and communication skills.",
    topic: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  })
}

export default function OpenEndedQuizPage({ params }: OpenEndedQuizPageProps) {
  return <OpenEndedQuizClient params={params} />
}
