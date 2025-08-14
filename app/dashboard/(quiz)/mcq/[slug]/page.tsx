import type { Metadata } from "next"
import { generateQuizPageMetadata } from "@/components/seo/QuizPageWrapper"
import McqQuizClient from "./McqQuizClient"
import prisma from "@/lib/db"
import { QuizSchema } from "@/lib/seo"
import React from "react"
import QuizSEOClient from "../../components/QuizSEOClient"

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

function QuizJsonLd({ slug, title }: { slug: string; title: string }) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"}/dashboard/mcq/${slug}`
  return (
    <QuizSchema
      name={title}
      url={url}
      description={`Interactive multiple-choice assessment on ${title}`}
      questions={[]}
    />
  )
}

export default function McqQuizPage({ params }: McqQuizPageProps) {
  // Render client with JSON-LD helper
  const ClientWithJsonLd = async () => {
    const { slug } = await params
    const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    return (
      <>
        <QuizSEOClient />
        <QuizJsonLd slug={slug} title={title} />
        <McqQuizClient params={params} />
      </>
    )
  }
  // @ts-expect-error Async Server Component
  return <ClientWithJsonLd />
}
