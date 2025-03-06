import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"

import { authOptions } from "@/lib/authOptions"
import { getQuiz } from "@/app/actions/getQuiz"
import { generatePageMetadata } from "@/lib/seo-utils"
import { BreadcrumbJsonLd } from "@/app/schema/breadcrumb-schema"
import SlugPageLayout from "@/components/SlugPageLayout"
import CodeQuizWrapper from "@/components/features/code/CodeQuizWrapper"
import { QuizSkeleton } from "@/components/features/mcq/QuizSkeleton"
import AnimatedQuizHighlight from "@/components/RanomQuiz"
import QuizSchema from "@/app/schema/quiz-schema"

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const quiz = await getQuiz(slug)

  if (!quiz) {
    return generatePageMetadata({
      title: "Code Challenge Not Found | CourseAI",
      description:
        "The requested programming challenge could not be found. Explore our other coding challenges and assessments.",
      path: `/dashboard/code/${slug}`,
      noIndex: true,
    })
  }

  return generatePageMetadata({
    title: `${quiz.topic} | Programming Code Challenge`,
    description: `Test your coding skills with this ${quiz.topic.toLowerCase()} programming challenge. Practice writing real code and improve your development abilities.`,
    path: `/dashboard/code/${slug}`,
    keywords: [
      `${quiz.topic.toLowerCase()} challenge`,
      "programming exercise",
      "coding practice",
      "developer skills test",
      "programming challenge",
    ],
    ogType: "article",
  })
}

const CodePage = async (props: { params: Promise<{ slug: string }> }) => {
  const params = await props.params
  const { slug } = params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"

  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id

  const result = await getQuiz(slug)
  if (!result) {
    notFound()
  }

  // Calculate estimated time based on question count and complexity
  const questionCount = result.questions?.length || 3
  const estimatedTime = `PT${Math.max(15, Math.ceil(questionCount * 10))}M` // 10 minutes per coding question, minimum 15 minutes

  // Create breadcrumb items
  const breadcrumbItems = [
    { name: "Home", url: baseUrl },
    { name: "Dashboard", url: `${baseUrl}/dashboard` },
    { name: "Quizzes", url: `${baseUrl}/dashboard/quizzes` },
    { name: result.topic, url: `${baseUrl}/dashboard/code/${slug}` },
  ]

  return (
    <SlugPageLayout
      title={result.topic}
      description={`Test your coding skills on ${result.topic} with interactive programming challenges`}
      sidebar={<AnimatedQuizHighlight />}
    >
      <QuizSchema
        quiz={{
          topic: result.topic,
          description: `Test your coding skills with this ${result.topic} programming challenge. Practice writing real code and improve your development abilities.`,
          questionCount: questionCount,
          estimatedTime: estimatedTime,
          level:  "Advanced",
          slug: slug,
        }}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Suspense fallback={<QuizSkeleton />}>
        <CodeQuizWrapper slug={slug} userId={currentUserId || ''} />
      </Suspense>
    </SlugPageLayout>
  )
}

export default CodePage

