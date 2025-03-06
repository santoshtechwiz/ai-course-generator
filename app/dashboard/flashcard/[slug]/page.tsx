import { getAuthSession } from "@/lib/authOptions"
import FlashCardsPageClient from "../components/FlashCardsPageClient"
import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo-utils"
import { getQuiz } from "@/app/actions/getQuiz"
import AnimatedQuizHighlight from "@/components/RanomQuiz"
import SlugPageLayout from "@/components/SlugPageLayout"
import QuizSchema from "@/app/schema/quiz-schema"
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const {slug}=await params;
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
    title: `${quiz.topic} | Programming Flashcards`,
    description: `Study and memorize key concepts about ${quiz.topic.toLowerCase()} with our interactive flashcards. Improve your programming knowledge efficiently.`,
    path: `/dashboard/flashcard/${slug}`,
    keywords: [
      `${quiz.topic.toLowerCase()} flashcards`,
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

  if (!quiz) {
    return null // This will trigger the not-found page
  }

  return (
    <SlugPageLayout sidebar={<AnimatedQuizHighlight />}>
      <QuizSchema
        quiz={{
          topic: quiz.topic,
          description: `Study and memorize key concepts about ${quiz.topic} with these interactive flashcards.`,
          questionCount: quiz.questions?.length || 10,
          estimatedTime: "PT15M", // 15 minutes in ISO 8601 duration format
          level: "All Levels",
          slug: slug,
        }}
      />
      <FlashCardsPageClient slug={slug} userId={userId} />
    </SlugPageLayout>
  )
}

