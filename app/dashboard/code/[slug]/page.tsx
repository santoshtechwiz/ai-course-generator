import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"

import { authOptions } from "@/lib/authOptions"
import { getQuiz } from "@/app/actions/getQuiz"
import { generatePageMetadata } from "@/lib/seo-utils"
import { BreadcrumbJsonLd } from "@/app/schema/breadcrumb-schema"
import { QuizStructuredData } from "@/components/withQuizStructuredData"
import SlugPageLayout from "@/components/SlugPageLayout"
import CodeQuizWrapper from "@/components/features/code/CodeQuizWrapper"
import { QuizSkeleton } from "@/components/features/mcq/QuizSkeleton"
import AnimatedQuizHighlight from "@/components/RanomQuiz"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const quiz = await getQuiz(params.slug)

  if (!quiz) {
    return {
      title: "Code Challenge Not Found | CourseAI",
      description:
        "The requested programming challenge could not be found. Explore our other coding challenges and assessments.",
    }
  }

  return generatePageMetadata({
    title: `${quiz.topic} | Programming Code Challenge`,
    description: `Test your coding skills with this ${quiz.topic.toLowerCase()} programming challenge. Practice writing real code and improve your development abilities.`,
    path: `/dashboard/code/${params.slug}`,
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

  const quizDetails = {
    type: "code",
    name: result.topic,
    description: `Test your programming skills with this ${result.topic} code challenge.`,
    author: "Course AI",
    datePublished: new Date(result.createdAt).toISOString(),
    numberOfQuestions: result.questions?.length || 0,
    timeRequired: "PT45M", // Assuming 45 minutes, adjust as needed
    educationalLevel: "Intermediate", // Adjust as needed
  }

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
      <QuizStructuredData quizDetails={quizDetails} />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Suspense fallback={<QuizSkeleton />}>
        <CodeQuizWrapper slug={slug} currentUserId={currentUserId || ""} result={result} />
      </Suspense>
    </SlugPageLayout>
  )
}

export default CodePage

