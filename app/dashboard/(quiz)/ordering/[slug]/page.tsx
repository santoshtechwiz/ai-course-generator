import type { Metadata } from "next"
import { generateQuizPageMetadata } from "@/components/seo/QuizPageWrapper"
import OrderingQuizWrapper from "./components/OrderingQuizWrapper"
import prisma from "@/lib/db"
import { QuizSchema } from "@/lib/seo"
import React from "react"
import QuizSEOClient from "../../components/QuizSEOClient"

interface OrderingQuizPageProps {
  params: Promise<{ slug: string }>
}

// Server component that generates proper SEO metadata
export async function generateMetadata({ params }: OrderingQuizPageProps): Promise<Metadata> {
  const { slug } = await params

  // Look up quiz to improve title/description and SEO flags
  let dbTitle: string | null = null
  let isPublic = false
  try {
    const quiz = await prisma.userQuiz.findUnique({
      where: { slug },
      select: { title: true, isPublic: true, quizType: true },
    })
    if (quiz && quiz.quizType === 'ordering') {
      dbTitle = quiz.title
      isPublic = Boolean(quiz.isPublic)
    }
  } catch {}

  const cleanTopic = (dbTitle || slug).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const noIndex = !dbTitle || !isPublic

  return generateQuizPageMetadata({
    quizType: "ordering",
    slug,
    title: `${cleanTopic} - Ordering Quiz`,
    description: `Test your knowledge of ${cleanTopic} with interactive ordering and sequencing challenges. Get instant feedback and detailed explanations.`,
    topic: cleanTopic,
    noIndex,
  })
}

function QuizJsonLd({ slug, title }: { slug: string; title: string }) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"}/dashboard/ordering/${slug}`
  return (
    <QuizSchema
      name={title}
      url={url}
      description={`Interactive ordering and sequencing assessment on ${title}`}
      questions={[]}
    />
  )
}

export default async function OrderingQuizPage({ params }: OrderingQuizPageProps) {
  const { slug } = await params
  const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  return (
    <>
      <QuizSEOClient />
      <QuizJsonLd slug={slug} title={title} />
      <OrderingQuizWrapper slug={slug} />
    </>
  )
}
