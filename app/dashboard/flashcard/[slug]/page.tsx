import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"

import { authOptions } from "@/lib/authOptions"
import { getQuiz } from "@/app/actions/getQuiz"
import { generatePageMetadata } from "@/lib/seo-utils"
import { BreadcrumbJsonLd } from "@/app/schema/breadcrumb-schema"
import SlugPageLayout from "@/components/SlugPageLayout"
import { QuizSkeleton } from "@/components/features/mcq/QuizSkeleton"
import AnimatedQuizHighlight from "@/components/RanomQuiz"
import FlashCardComponent from "@/components/features/flashcard/FlashCardComponent"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const quiz = await getQuiz(params.slug)

  if (!quiz) {
    return {
      title: "Flashcards Not Found | CourseAI",
      description: "The requested flashcards could not be found. Explore our other learning resources and tools.",
    }
  }

  return generatePageMetadata({
    title: `${quiz.topic} | Programming Flashcards`,
    description: `Study and memorize key concepts about ${quiz.topic.toLowerCase()} with our interactive flashcards. Improve your programming knowledge efficiently.`,
    path: `/dashboard/flashcard/${params.slug}`,
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

const FlashcardPage = async (props: { params: Promise<{ slug: string }> }) => {
  const params = await props.params
  const { slug } = params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"

  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id

  const result = await getQuiz(slug)
  if (!result) {
    notFound()
  }

  // Learning Resource schema
  const learningResourceSchema = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: `${result.topic} Flashcards`,
    description: `Study and memorize key concepts about ${result.topic} with our interactive flashcards.`,
    learningResourceType: "Flashcard",
    educationalUse: ["Self-Study", "Memorization"],
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "Student",
    },
    creator: {
      "@type": "Organization",
      name: "Course AI",
    },
    dateCreated: new Date(result.createdAt).toISOString(),
    url: `${baseUrl}/dashboard/flashcard/${slug}`,
  }

  // Create breadcrumb items
  const breadcrumbItems = [
    { name: "Home", url: baseUrl },
    { name: "Dashboard", url: `${baseUrl}/dashboard` },
    { name: "Quizzes", url: `${baseUrl}/dashboard/quizzes` },
    { name: result.topic, url: `${baseUrl}/dashboard/flashcard/${slug}` },
  ]

  return (
    <SlugPageLayout
      title={result.topic}
      description={`Study and memorize key concepts about ${result.topic} with our interactive flashcards`}
      sidebar={<AnimatedQuizHighlight />}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(learningResourceSchema) }} />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Suspense fallback={<QuizSkeleton />}>
        <FlashCardComponent slug={slug} currentUserId={currentUserId || ""} result={result} />
      </Suspense>
    </SlugPageLayout>
  )
}

export default FlashcardPage

