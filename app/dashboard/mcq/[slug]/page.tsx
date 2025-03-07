import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/authOptions"

import getMcqQuestions from "@/app/actions/getMcqQuestions"
import McqQuizWrapper from "@/components/features/mcq/McqQuizWrapper"
import { QuizSkeleton } from "@/components/features/mcq/QuizSkeleton"
import RandomQuiz from "@/components/RanomQuiz"
import SlugPageLayout from "@/components/SlugPageLayout"
import { generatePageMetadata, generateQuizSchema } from "@/lib/seo-utils"

// SEO metadata generation
export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params

  const quiz = await prisma.userQuiz.findUnique({
    where: { slug },
    select: {
      id: true,
      topic: true,
      questions: true,
      user: { select: { name: true } },
    },
  })

  if (!quiz) {
    return generatePageMetadata({
      title: "Quiz Not Found | CourseAI",
      description: "The requested quiz could not be found.",
      path: `/quiz/${slug}`,
      noIndex: true,
    })
  }

  const title = `${quiz.topic} Quiz | Test Your Knowledge`
  const description = `Test your knowledge with this ${quiz.topic} quiz created by ${quiz.user.name}. ${quiz.questions.length} questions to challenge yourself and learn something new!`
  const ogImage = `/api/og?title=${encodeURIComponent(quiz.topic)}`

  return generatePageMetadata({
    title,
    description,
    path: `/quiz/${slug}`,
    keywords: [quiz.topic, "quiz", "test", "knowledge", "learning", "multiple choice"],
    ogImage,
    ogType: "website",
  })
}

// Generate static paths for common quizzes
export async function generateStaticParams() {
  const quizzes = await prisma.userQuiz.findMany({
    where: { isPublic: true }, // Only include published quizzes
    select: { slug: true },
    take: 100, // Limit to most popular/recent quizzes
  })

  return quizzes.filter((quiz) => quiz.slug).map((quiz) => ({ slug: quiz.slug }))
}

const McqPage = async (props: { params: Promise<{ slug: string }> }) => {
  const { slug } = await props.params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"

  // Get current user session
  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id || ""

  // Fetch quiz data
  const result = await getMcqQuestions(slug)
  if (!result || !result.result) {
    notFound()
  }

  const { result: quizData, questions } = result

  // Generate structured data for the quiz
  const quizSchema = generateQuizSchema({
    name: quizData.topic,
    description: `Test your knowledge with this ${quizData.topic} quiz.`,
    url: `${baseUrl}/quiz/${slug}`,
    numberOfQuestions: questions.length,
    timeRequired: "PT30M", // ISO 8601 duration format - 30 minutes
    educationalLevel: "Beginner",
  })

  return (
    <>
      {/* Add JSON-LD structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(quizSchema) }} />

      <SlugPageLayout
        title={quizData.topic}
        description={`Test your knowledge on ${quizData.topic}`}
        sidebar={<RandomQuiz />}
      >
        <Suspense fallback={<QuizSkeleton />}>
          <McqQuizWrapper slug={slug} currentUserId={currentUserId} result={result} />
        </Suspense>
      </SlugPageLayout>
    </>
  )
}

export default McqPage

