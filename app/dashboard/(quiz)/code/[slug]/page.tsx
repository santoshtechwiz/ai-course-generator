import type { Metadata } from "next"
import { generateQuizPageMetadata } from "@/components/seo/QuizPageWrapper"
import CodeQuizClient from "./CodeQuizClient"
import prisma from "@/lib/db"
import { QuizSchema } from "@/lib/seo"
import React from "react"
import QuizSEOClient from "../../components/QuizSEOClient"

interface CodeQuizPageProps {
  params: Promise<{ slug: string }>
}

// Server component that generates proper SEO metadata
export async function generateMetadata({ params }: CodeQuizPageProps): Promise<Metadata> {
  const { slug } = await params
  
  // Create better SEO title using DB title if available
  let dbTitle: string | null = null
  let isPublic = false
  try {
    const quiz = await prisma.userQuiz.findUnique({ where: { slug }, select: { title: true, isPublic: true } })
    if (quiz) { dbTitle = quiz.title; isPublic = Boolean(quiz.isPublic) }
  } catch {}
  const cleanTopic = (dbTitle || slug).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  const noIndex = !dbTitle || !isPublic
  
  return generateQuizPageMetadata({
    quizType: "code",
    slug,
    title: `${cleanTopic} - Programming Challenge`,
    description: `Master ${cleanTopic} programming concepts with hands-on coding challenges. Write, debug, and optimize code with real-time feedback and explanations.`,
    topic: cleanTopic,
    noIndex,
  })
}

function QuizJsonLd({ slug, title }: { slug: string; title: string }) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"}/dashboard/code/${slug}`
  return (
    <QuizSchema
      name={title}
      url={url}
      description={`Programming challenge on ${title}`}
      questions={[]}
    />
  )
}

export default function CodeQuizPage({ params }: CodeQuizPageProps) {
  const ClientWithJsonLd = async () => {
    const { slug } = await params
    const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    return (
      <>
        <QuizSEOClient />
        <QuizJsonLd slug={slug} title={title} />
        <CodeQuizClient params={params} />
      </>
    )
  }
  // @ts-expect-error Async Server Component
  return <ClientWithJsonLd />
}
