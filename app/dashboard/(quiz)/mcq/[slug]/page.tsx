import type { Metadata } from "next"
import { generateQuizPageMetadata } from "@/components/seo/QuizPageWrapper"
import McqQuizClient from "./McqQuizClient"
import prisma from "@/lib/db"

interface McqQuizPageProps {
  params: Promise<{ slug: string }>
}

// Server component that generates proper SEO metadata
export async function generateMetadata({ params }: McqQuizPageProps): Promise<Metadata> {
  const { slug } = await params

  // Look up quiz to improve title/description and SEO flags
  let dbTitle: string | null = null
  let isPublic = false
  let questionsCount: number | undefined = undefined
  try {
    const quiz = await prisma.userQuiz.findUnique({
      where: { slug },
      select: { title: true, isPublic: true, _count: { select: { questions: true } } },
    })
    if (quiz) {
      dbTitle = quiz.title
      isPublic = Boolean(quiz.isPublic)
      questionsCount = quiz._count?.questions
    }
  } catch {}

  const cleanTopic = (dbTitle || slug).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const noIndex = !dbTitle || !isPublic

  return generateQuizPageMetadata({
    quizType: "mcq",
    slug,
    title: `${cleanTopic} - Multiple Choice Quiz`,
    description: `Test your knowledge of ${cleanTopic} with interactive multiple choice questions. Get instant feedback and detailed explanations for each answer.`,
    topic: cleanTopic,
    noIndex,
  })
}

export default function McqQuizPage({ params }: McqQuizPageProps) {
  return <McqQuizClient params={params} />
}
