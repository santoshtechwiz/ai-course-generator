import { getAuthSession } from "@/lib/authOptions"
import FlashCardsPageClient from "../components/FlashCardsPageClient"
import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo-utils"
import { getQuiz } from "@/app/actions/getQuiz"
import { QuizDetailPage } from "@/components/QuizDetailsWrapper"

type Params = Promise<{ slug: string }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const quiz = await getQuiz(slug)

  if (!quiz) {
    return generatePageMetadata({
      title: "Flashcards Not Found | CourseAI",
      description: "The requested flashcards could not be found. Explore our other learning resources and tools.",
      path: `/dashboard/flashcard/${slug}`,
      noIndex: true,
    })
  }

  return generatePageMetadata({
    title: `${quiz.title} | Programming Flashcards`,
    description: `Study and memorize key concepts about ${quiz.title.toLowerCase()} with our interactive flashcards. Improve your programming knowledge efficiently.`,
    path: `/dashboard/flashcard/${slug}`,
    keywords: [
      `${quiz.title.toLowerCase()} flashcards`,
      "programming study aids",
      "coding concepts",
      "developer learning tools",
      "programming memorization",
    ],
    ogType: "article",
  })
}

interface FlashCardsPageProps {
  params: Promise<{ slug: string }>
}

export default async function FlashCardsPage({ params }: FlashCardsPageProps) {
  const userId = (await getAuthSession())?.user.id ?? ""
  const slug = (await params).slug
  const quiz = await getQuiz(slug)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"

  if (!quiz) {
    return null // This will trigger the not-found page
  }

  // Create breadcrumb items
  const breadcrumbItems = [
    { name: "Home", url: baseUrl },
    { name: "Dashboard", url: `${baseUrl}/dashboard` },
    { name: "Flashcards", url: `${baseUrl}/dashboard/flashcard` },
    { name: quiz.title, url: `${baseUrl}/dashboard/flashcard/${slug}` },
  ]

  return (
    <QuizDetailPage
      title={quiz.title}
      description="Study and memorize key concepts with these interactive flashcards."
      slug={slug}
      quizType="flashcard"
      questionCount={quiz.questions?.length || 10}
      estimatedTime="PT15M"
      breadcrumbItems={breadcrumbItems}
    >
      <FlashCardsPageClient slug={slug} userId={userId} />
    </QuizDetailPage>
  )
}

