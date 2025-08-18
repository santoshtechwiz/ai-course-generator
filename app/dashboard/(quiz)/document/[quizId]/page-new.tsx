import type { Metadata } from "next"
import { generateQuizPageMetadata } from "@/components/seo/QuizPageWrapper"
import DocumentQuizClient from "./DocumentQuizClient"

interface DocumentQuizPageProps {
  params: Promise<{ quizId: string }>
}

// Server component that generates proper SEO metadata
export async function generateMetadata({ params }: DocumentQuizPageProps): Promise<Metadata> {
  const { quizId } = await params
  
  return generateQuizPageMetadata({
    quizType: "document",
    slug: quizId,
    title: `Document Quiz: ${quizId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
    description: "Answer questions based on document content. Test your reading comprehension and analytical skills.",
    topic: quizId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  })
}

export default function DocumentQuizPage({ params }: DocumentQuizPageProps) {
  return <DocumentQuizClient params={params} />
}
