import type { Metadata } from "next"
import { generateQuizPageMetadata } from "@/components/seo/QuizPageWrapper"
import BlanksQuizClient from "./BlanksQuizClient"
import prisma from "@/lib/db"
import { QuizSchema } from "@/lib/seo"
import React from "react"
import QuizSEOClient from "../../components/QuizSEOClient"

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

function QuizJsonLd({ slug, title }: { slug: string; title: string }) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"}/dashboard/blanks/${slug}`
  return (
    <QuizSchema
      name={title}
      url={url}
      description={`Fill in the blanks quiz on ${title}`}
      questions={[]}
    />
  )
}

export default function BlanksQuizPage({ params }: BlanksQuizPageProps) {
  const ClientWithJsonLd = async () => {
    const { slug } = await params
    const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    return (
      <>
        <QuizSEOClient />
        <QuizJsonLd slug={slug} title={title} />
        <BlanksQuizClient params={params} />
      </>
    )
  }
  // @ts-expect-error Async Server Component
  return <ClientWithJsonLd />
}
