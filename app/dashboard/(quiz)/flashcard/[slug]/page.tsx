import { getAuthSession } from "@/lib/authOptions"
import FlashCardsPageClient from "../components/FlashCardsPageClient"
import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo-utils"
import { getQuiz } from "@/app/actions/getQuiz"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { notFound } from "next/navigation"
import QuizDetailsPage from "../../components/QuizDetailsPage"

type Params = Promise<{ slug: string }>
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

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

  // Extract keywords from quiz title
  const titleWords = quiz.title?.toLowerCase().split(" ")
  const keyTerms = titleWords.filter((word) => word.length > 3)

  return generatePageMetadata({
    title: `Free ${quiz.title} Flashcard Generator | Practice Coding with Interactive Flashcards`,
    description: `Boost your understanding of ${quiz.title?.toLowerCase()} with our free interactive flashcard generator. Ideal for developers and learners, this tool uses spaced repetition and active recall to help you master concepts faster. Includes ${quiz.questions?.length || 0} practice questions tailored to sharpen your coding skills.`,
    path: `/dashboard/flashcard/${slug}`,
    keywords: [
      `free ${quiz.title?.toLowerCase()} flashcard generator`,
      `create ${quiz.title?.toLowerCase()} flashcards online`,
      `${quiz.title?.toLowerCase()} practice questions`,
      `interactive ${quiz.title?.toLowerCase()} quiz`,
      `learn ${quiz.title?.toLowerCase()} with flashcards`,
      `online flashcard maker for ${quiz.title?.toLowerCase()}`,
      "free flashcard generator",
      "coding flashcards",
      "programming flashcard maker",
      "developer learning tools",
      "interactive coding quizzes",
      "spaced repetition for programmers",
      "active recall study method",
      "tech flashcards",
      "flashcards for coding interviews",
      ...keyTerms.map((term) => `free ${term} flashcards`),
    ],
    ogType: "article",
    ogImage: `/api/og?title=${encodeURIComponent(quiz.title)}&description=${encodeURIComponent("Interactive Programming Flashcards")}`,
  })
}

interface FlashCardsPageProps {
  params: Promise<{ slug: string }>
}

export default async function FlashCardsPage({ params }: FlashCardsPageProps) {
  const userId = (await getAuthSession())?.user.id ?? ""
  const slug = (await params).slug
  const quiz = await getQuiz(slug)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  if (!quiz) {
    notFound()
  }

  // Create breadcrumb items
  const breadcrumbItems = [
    { name: "Dashboard", href: `${baseUrl}/dashboard` },
    { name: "Flashcards", href: `${baseUrl}/dashboard/quizzes?type=flashcard` },
    { name: quiz.title, href: `${baseUrl}/dashboard/flashcard/${slug}` },
  ]

  return (
    <>
      <QuizDetailsPage
        title={quiz.title}
        description={`Study and memorize key ${quiz.title} concepts with these interactive flashcards. Perfect for all level developers looking to strengthen their knowledge through active recall.`}
        slug={slug}
        quizType="flashcard"
        questionCount={quiz.questions?.length || 0}
        estimatedTime="PT15M"
        breadcrumbItems={breadcrumbItems}
      >
        <Suspense fallback={<FlashcardSkeleton />}>
          <FlashCardsPageClient slug={slug} userId={userId} />
        </Suspense>
      </QuizDetailsPage>
    </>
  )
}

function FlashcardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full border-b border-border/50 px-4 sm:px-6 py-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-5 w-24 mt-2 sm:mt-0" />
      </div>

      <div className="p-4 sm:p-6 md:p-8 border-b border-border/50">
        <div className="relative min-h-[300px] w-full">
          <Skeleton className="absolute inset-0 rounded-xl" />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-3 sm:gap-0">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-5 w-36" />
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>

        <div className="mt-6 px-1">
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex justify-between mt-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  )
}
