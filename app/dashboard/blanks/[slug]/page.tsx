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

import { QuizSkeleton } from "@/components/features/mcq/QuizSkeleton"
import AnimatedQuizHighlight from "@/components/RanomQuiz"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const quiz = await getQuiz(params.slug)

  if (!quiz) {
    return {
      title: "Fill in the Blanks Quiz Not Found | CourseAI",
      description:
        "The requested programming quiz could not be found. Explore our other coding challenges and assessments.",
    }
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

  const quizDetails = {
    type: "blanks",
    name: result.topic,
    description: `Test your programming knowledge with this ${result.topic} fill in the blanks quiz.`,
    author: "Course AI",
    datePublished: new Date(result.createdAt).toISOString(),
    numberOfQuestions: result.questions?.length || 0,
    timeRequired: "PT20M", // Assuming 20 minutes, adjust as needed
    educationalLevel: "Beginner", // Adjust as needed
  }

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
      sidebar={<AnimatedQuizHighlight />}
    >
      <QuizStructuredData quizDetails={quizDetails} />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Suspense fallback={<QuizSkeleton />}>
        <BlanksQuizWrapper slug={slug} currentUserId={currentUserId || ""} result={result} />
      </Suspense>
    </SlugPageLayout>
  )
}

export default BlanksPage

