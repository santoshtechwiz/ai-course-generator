import type { Metadata } from "next"
import { generateQuizPageMetadata } from "@/components/seo/QuizPageWrapper"
import BlanksQuizClient from "./BlanksQuizClient"
import prisma from "@/lib/db"

interface BlanksQuizPageProps {
  params: Promise<{ slug: string }>
}

// Server component that generates proper SEO metadata
export async function generateMetadata({ params }: BlanksQuizPageProps): Promise<Metadata> {
  const { slug } = await params
  
  let dbTitle: string | null = null
  let isPublic = false
  try {
    const quiz = await prisma.userQuiz.findUnique({ where: { slug }, select: { title: true, isPublic: true } })
    if (quiz) { dbTitle = quiz.title; isPublic = Boolean(quiz.isPublic) }
  } catch {}

  const clean = (dbTitle || slug).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const noIndex = !dbTitle || !isPublic

  return generateQuizPageMetadata({
    quizType: "blanks",
    slug,
    title: `Fill in the Blanks Quiz: ${clean}`,
    description: "Test your knowledge with fill-in-the-blank questions. Complete sentences and statements to demonstrate your understanding.",
    topic: clean,
    noIndex,
  })
}

export default function BlanksQuizPage({ params }: BlanksQuizPageProps) {
  return <BlanksQuizClient params={params} />
}
