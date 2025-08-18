import type { Metadata } from "next"
import { generateQuizPageMetadata } from "@/components/seo/QuizPageWrapper"
import FlashcardQuizClient from "./FlashcardQuizClient"
import prisma from "@/lib/db"
import { QuizSchema } from "@/lib/seo"
import React from "react"
import QuizSEOClient from "../../components/QuizSEOClient"

interface FlashcardQuizPageProps {
  params: Promise<{ slug: string }>
}

// Server component that generates proper SEO metadata
export async function generateMetadata({ params }: FlashcardQuizPageProps): Promise<Metadata> {
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
    quizType: "flashcard",
    slug,
    title: `${cleanTopic} - Study Flashcards`,
    description: `Master ${cleanTopic} concepts with interactive flashcards. Study key terms, definitions, and important facts with spaced repetition learning.`,
    topic: cleanTopic,
    noIndex,
  })
}

function QuizJsonLd({ slug, title }: { slug: string; title: string }) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"}/dashboard/flashcard/${slug}`
  return (
    <QuizSchema
      name={title}
      url={url}
      description={`Study flashcards on ${title}`}
      questions={[]}
    />
  )
}

export default function FlashcardQuizPage({ params }: FlashcardQuizPageProps) {
  const ClientWithJsonLd = async () => {
    const { slug } = await params
    const title = slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    return (
      <>
        <QuizSEOClient />
        <QuizJsonLd slug={slug} title={title} />
        <FlashcardQuizClient params={params} />
      </>
    )
  }
  // @ts-expect-error Async Server Component
  return <ClientWithJsonLd />
}
