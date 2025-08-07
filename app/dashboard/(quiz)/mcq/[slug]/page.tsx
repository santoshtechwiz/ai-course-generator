import type { Metadata } from "next"
import { generateQuizPageMetadata } from "@/components/seo/QuizPageWrapper"
import McqQuizClient from "./McqQuizClient"

interface McqQuizPageProps {
  params: Promise<{ slug: string }>
}

// Server component that generates proper SEO metadata
export async function generateMetadata({ params }: McqQuizPageProps): Promise<Metadata> {
  const { slug } = await params
  
  return generateQuizPageMetadata({
    quizType: "mcq",
    slug,
    title: `MCQ Quiz: ${slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    description: "Take this multiple choice quiz to test your knowledge and improve your skills. Interactive questions with instant feedback and detailed explanations.",
    topic: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  })
}

export default function McqQuizPage({ params }: McqQuizPageProps) {
  return <McqQuizClient params={params} />
}
