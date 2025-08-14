import type { Metadata } from "next"
import { generateQuizPageMetadata } from "@/components/seo/QuizPageWrapper"
import BlanksQuizClient from "./BlanksQuizClient"

interface BlanksQuizPageProps {
  params: Promise<{ slug: string }>
}

// Server component that generates proper SEO metadata
export async function generateMetadata({ params }: BlanksQuizPageProps): Promise<Metadata> {
  const { slug } = await params
  
  const clean = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const likelyInvalid = slug.length < 3 || /[^a-z0-9-]/i.test(slug)

  return generateQuizPageMetadata({
    quizType: "blanks",
    slug,
    title: `Fill in the Blanks Quiz: ${clean}`,
    description: "Test your knowledge with fill-in-the-blank questions. Complete sentences and statements to demonstrate your understanding.",
    topic: clean,
    noIndex: likelyInvalid
  })
}

export default function BlanksQuizPage({ params }: BlanksQuizPageProps) {
  return <BlanksQuizClient params={params} />
}
