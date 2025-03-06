import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"

import { authOptions } from "@/lib/authOptions"
import { getQuiz } from "@/app/actions/getQuiz"
import { generatePageMetadata } from "@/lib/seo-utils"
import { BreadcrumbJsonLd } from "@/app/schema/breadcrumb-schema"
import SlugPageLayout from "@/components/SlugPageLayout"
import { QuizWrapper } from "@/components/QuizWrapper"
import { QuizSkeleton } from "@/components/features/mcq/QuizSkeleton"
import AnimatedQuizHighlight from "@/components/RanomQuiz"
import QuizSchema from "@/app/schema/quiz-schema"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const quiz = await getQuiz(params.slug)

  if (!quiz) {
    return generatePageMetadata({
      title: "Quiz Not Found | CourseAI",
      description: "The requested quiz could not be found. Explore our other programming quizzes and assessments.",
      path: `/dashboard/mcq/${params.slug}`,
      noIndex: true,
    })
  }

  return generatePageMetadata({
    title: `${quiz.topic} | Multiple Choice Quiz`,
    description: `Test your knowledge on ${quiz.topic.toLowerCase()} with this interactive multiple-choice quiz. Enhance your programming skills through practice.`,
    path: `/dashboard/mcq/${params.slug}`,
    keywords: [
      `${quiz.topic.toLowerCase()} quiz`,
      "multiple choice questions",
      "programming assessment",
      "coding knowledge test",
      "developer skills evaluation",
    ],
    ogType: "article",
  })
}

const Page = async ({ params }: { params: { slug: string } }) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"
  const quiz = await getQuiz(params.slug)

  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id

  if (!quiz) {
    notFound()
  }

  // Calculate estimated time based on question count
  const questionCount = quiz.questions?.length || 10
  const estimatedTime = `PT${Math.max(5, Math.ceil(questionCount * 1.5))}M` // 1.5 minutes per question, minimum 5 minutes

  // Create breadcrumb items
  const breadcrumbItems = [
    { name: "Home", url: baseUrl },
    { name: "Dashboard", url: `${baseUrl}/dashboard` },
    { name: "Quizzes", url: `${baseUrl}/dashboard/quizzes` },
    { name: quiz.topic, url: `${baseUrl}/dashboard/mcq/${params.slug}` },
  ]

  return (
    <SlugPageLayout
      title={quiz.topic}
      description={`Test your knowledge on ${quiz.topic} with this interactive multiple-choice quiz`}
      sidebar={<AnimatedQuizHighlight />}
    >
      <QuizSchema
        quiz={{
          topic: quiz.topic,
          description: `Test your knowledge on ${quiz.topic} with this interactive multiple-choice quiz.`,
          questionCount: questionCount,
          estimatedTime: estimatedTime,
          level: "Intermediate",
          slug: params.slug,
        }}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Suspense fallback={<QuizSkeleton />}>
        <QuizWrapper type="mcq" />
      </Suspense>
    </SlugPageLayout>
  )
}

export default Page

