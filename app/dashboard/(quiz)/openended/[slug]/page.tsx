import type { Metadata } from "next"
import { generateQuizPageMetadata } from "@/components/seo/QuizPageWrapper"
import OpenEndedQuizClient from "./OpenEndedQuizClient"
import prisma from "@/lib/db"

interface OpenEndedQuizPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: OpenEndedQuizPageProps): Promise<Metadata> {
  const { slug } = await params
  
  let dbTitle: string | null = null
  let isPublic = false
  try {
    const quiz = await prisma.userQuiz.findUnique({ where: { slug }, select: { title: true, isPublic: true } })
    if (quiz) { dbTitle = quiz.title; isPublic = Boolean(quiz.isPublic) }
  } catch {}

  const cleanTopic = (dbTitle || slug).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const noIndex = !dbTitle || !isPublic

  return generateQuizPageMetadata({
    quizType: "openended",
    slug,
    title: `${cleanTopic} - Open-Ended Quiz`,
    description: `Practice writing detailed responses about ${cleanTopic}. Get guidance and constructive feedback.`,
    topic: cleanTopic,
    noIndex,
  })
}

export default function OpenEndedQuizPage({ params }: OpenEndedQuizPageProps) {
  return <OpenEndedQuizClient params={params} />
}
