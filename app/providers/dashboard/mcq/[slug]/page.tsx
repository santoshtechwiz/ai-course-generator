import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/authOptions"

import getMcqQuestions from "@/app/actions/getMcqQuestions"
import McqQuizWrapper from "@/components/features/mcq/McqQuizWrapper"
import { QuizSkeleton } from "@/components/features/mcq/QuizSkeleton"
import AnimatedQuizHighlight from "@/components/RanomQuiz"
import { QuizStructuredData } from "@/components/withQuizStructuredData"
import SlugPageLayout from "@/components/SlugPageLayout"
import { getQuiz } from "@/app/actions/getQuiz"
import { generatePageMetadata } from "@/lib/seo-utils"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const quiz = await getQuiz(params.slug)

  if (!quiz) {
    return {
      title: "MCQ Quiz Not Found | CourseAI",
      description:
        "The requested programming quiz could not be found. Explore our other coding challenges and assessments.",
    }
  }

  return generatePageMetadata({
    title: `${quiz.topic} | Programming MCQ Quiz`,
    description: `Test your coding knowledge with this ${quiz.topic.toLowerCase()} multiple-choice quiz. Practice programming concepts and improve your skills.`,
    path: `/dashboard/quiz/${params.slug}`,
    keywords: [
      `${quiz.topic.toLowerCase()} quiz`,
      "programming MCQs",
      "coding assessment",
      "developer knowledge test",
      "programming practice questions",
    ],
    ogType: "article",
  })
}

export async function generateStaticParams() {
  const quizzes = await prisma.userQuiz.findMany({
    select: { slug: true },
  })

  return quizzes.filter((quiz) => quiz.slug).map((quiz) => ({ slug: quiz.slug }))
}

const McqPage = async (props: { params: Promise<{ slug: string }> }) => {
  const params = await props.params
  const { slug } = params

  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id

  const result = await getMcqQuestions(slug)
  if (!result) {
    notFound()
  }
  if (!result.result) {
    notFound()
  }

  const quizDetails = {
    type: "mcq",
    name: result.result.topic,
    description: `Test your programming knowledge with this ${result.result.topic} quiz.`,
    author: "Course AI",
    datePublished: new Date().toISOString(),
    numberOfQuestions: result.questions.length || 0,
    timeRequired: "PT30M", // Assuming 30 minutes, adjust as needed
    educationalLevel: "Beginner", // Adjust as needed
  }

  return (
    <SlugPageLayout
      title={result.result.topic}
      description={`Test your coding knowledge on ${result.result.topic}`}
      sidebar={<AnimatedQuizHighlight />}
    >
      <QuizStructuredData quizDetails={quizDetails} />
      <Suspense fallback={<QuizSkeleton />}>
        <McqQuizWrapper slug={slug} currentUserId={currentUserId || ""} result={result} />
      </Suspense>
    </SlugPageLayout>
  )
}

export default McqPage

