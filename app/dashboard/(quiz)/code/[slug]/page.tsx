import type { Metadata } from "next"
import { generateQuizPageMetadata } from "@/components/seo/QuizPageWrapper"
import CodeQuizClient from "./CodeQuizClient"

interface CodeQuizPageProps {
  params: Promise<{ slug: string }>
}

// Server component that generates proper SEO metadata
export async function generateMetadata({ params }: CodeQuizPageProps): Promise<Metadata> {
  const { slug } = await params
  
  return generateQuizPageMetadata({
    quizType: "code",
    slug,
    title: `Code Quiz: ${slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    description: "Test your coding skills with this interactive programming quiz. Write, debug, and optimize code with real-time feedback.",
    topic: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  })
}

export default function CodeQuizPage({ params }: CodeQuizPageProps) {
  return <CodeQuizClient params={params} />
}
