import type { Metadata } from "next"
import { generateQuizPageMetadata } from "@/components/seo/QuizPageWrapper"
import BlanksQuizClient from "./BlanksQuizClient"

interface BlanksQuizPageProps {
  params: Promise<{ slug: string }>
}

// Server component that generates proper SEO metadata
export async function generateMetadata({ params }: BlanksQuizPageProps): Promise<Metadata> {
  const { slug } = await params
  
  return generateQuizPageMetadata({
    quizType: "blanks",
    slug,
    title: `Fill in the Blanks Quiz: ${slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    description: "Test your knowledge with fill-in-the-blank questions. Complete sentences and statements to demonstrate your understanding.",
    topic: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  })
}

export default function BlanksQuizPage({ params }: BlanksQuizPageProps) {
  return <BlanksQuizClient params={params} />
}
