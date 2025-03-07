import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"

import { authOptions } from "@/lib/authOptions"
import { getQuiz } from "@/app/actions/getQuiz"
import { generatePageMetadata } from "@/lib/seo-utils"
import { BreadcrumbJsonLd } from "@/app/schema/breadcrumb-schema"

import { QuizSkeleton } from "@/components/features/mcq/QuizSkeleton"
import RandomQuiz from "@/components/RanomQuiz"
import QuizSchema from "@/app/schema/quiz-schema"
import BlankQuizWrapper from "@/components/features/blanks/BlankQuizWrapper"
import SlugPageLayout from "@/components/SlugPageLayout"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const quiz = await getQuiz(params.slug)

  if (!quiz) {
    return generatePageMetadata({
      title: "Fill in the Blanks Quiz Not Found | CourseAI",
      description:
        "The requested programming quiz could not be found. Explore our other coding challenges and assessments.",
      path: `/dashboard/blanks/${params.slug}`,
      noIndex: true,
    })
  }

  return generatePageMetadata({
    title: `${quiz.topic} | Programming Fill in the Blanks Quiz`,
    description: `Test your coding knowledge with this ${quiz.topic.toLowerCase()} fill in the blanks quiz. Practice programming concepts and improve your skills.`,
    path: `/dashboard/blanks/${params.slug}`,
    keywords: [
      `${quiz.topic.toLowerCase()} quiz`,
      "programming fill in the blanks",
      "coding assessment",
      "developer knowledge test",
      "programming practice questions",
    ],
    ogType: "article",
  })
}

const BlanksPage = async (props: { params: Promise<{ slug: string }> }) => {
  const params = await props.params
  const { slug } = params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"

  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id

  const result = await getQuiz(slug)
  if (!result) {
    notFound()
  }

  // Calculate estimated time based on question count
  const questionCount = result.questions?.length || 5
  const estimatedTime = `PT${Math.max(10, Math.ceil(questionCount * 2))}M` // 2 minutes per question, minimum 10 minutes

  // Create breadcrumb items
  const breadcrumbItems = [
    { name: "Home", url: baseUrl },
    { name: "Dashboard", url: `${baseUrl}/dashboard` },
    { name: "Quizzes", url: `${baseUrl}/dashboard/quizzes` },
    { name: result.topic, url: `${baseUrl}/dashboard/blanks/${slug}` },
  ]

  return (
    <SlugPageLayout
      title={result.topic}
      description={`Test your coding knowledge on ${result.topic} with fill in the blanks questions`}
      sidebar={<RandomQuiz />}
    >
      <QuizSchema
        quiz={{
          topic: result.topic,
          description: `Test your coding knowledge with this ${result.topic} fill in the blanks quiz. Practice programming concepts and improve your skills.`,
          questionCount: questionCount,
          estimatedTime: estimatedTime,
          level:  "Intermediate",
          slug: slug,
        }}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Suspense fallback={<QuizSkeleton />}>
        <BlankQuizWrapper slug={slug}  />
      </Suspense>
    </SlugPageLayout>
  )
}

export default BlanksPage

