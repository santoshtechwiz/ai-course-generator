import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"
import { Suspense } from "react"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/authOptions"
import getMcqQuestions from "@/app/actions/getMcqQuestions"
import { generatePageMetadata } from "@/lib/seo-utils"

import { Skeleton } from "@/components/ui/skeleton"
import McqQuiz from "../components/McqQuiz"
import QuizDetailsPage from "../../components/QuizDetailsPage"

export const QuizSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-3/4 rounded-md" />
      <Skeleton className="h-6 w-1/2 rounded-md" />
    </div>

    <div className="space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-full rounded-md" />
        <div className="grid gap-3">
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
    </div>
  </div>
)

// SEO metadata generation
export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params

  const quiz = await prisma.userQuiz.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
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

  const title = `${quiz.title} Quiz | Test Your Knowledge`
  const description = `Test your knowledge with this ${quiz.title} quiz created by ${quiz.user.name}. ${quiz.questions.length} questions to challenge yourself and learn something new!`
  const ogImage = `/api/og?title=${encodeURIComponent(quiz.title)}`

  return generatePageMetadata({
    title,
    description,
    path: `/quiz/${slug}`,
    keywords: [quiz.title, "quiz", "test", "knowledge", "learning", "multiple choice"],
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

// Optimize the MCQ Quiz Page component to prevent redundant API calls
const McqPage = async (props: { params: Promise<{ slug: string }> }) => {
  const { slug } = await props.params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  // Get current user session
  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id || ""

  console.log(`Fetching MCQ quiz data for slug: ${slug}`)

  // Fetch quiz data - this is the only API call we should make
  const result = await getMcqQuestions(slug)
  if (!result || !result.result) {
    console.error(`Quiz not found for slug: ${slug}`)
    notFound()
  }

  const { result: quizData, questions } = result

  console.log(`Successfully fetched quiz: ${quizData.title} with ${questions.length} questions`)

  // Create breadcrumb items
  const breadcrumbItems = [
    { name: "Quizzes", href: `${baseUrl}/dashboard/quizzes` },
    { name: quizData.title, href: `${baseUrl}/dashboard/mcq/${slug}` },
  ]

  // Estimate quiz time based on question count
  const estimatedTime = `PT${Math.max(5, Math.min(60, questions.length * 2))}M`

  return (
    <QuizDetailsPage
      title={quizData.title}
      description={`Test your knowledge on ${quizData.title}`}
      slug={slug}
      quizType="mcq"
      questionCount={questions.length}
      estimatedTime={estimatedTime}
      breadcrumbItems={breadcrumbItems}
      authorId={quizData.userId}
      quizId={quizData.id?.toString()}
      isFavorite={quizData.isFavorite}
      isPublic={quizData.isPublic}
      difficulty={quizData.difficulty || "medium"}
    >
      <div className="flex flex-col gap-8 animate-fade-in">
        {/* Quiz Content with Suspense */}
        <Suspense fallback={<QuizSkeleton />}>
          {questions && (
            <McqQuiz questions={questions} title={quizData.title} quizId={Number(quizData.id) || 0} slug={slug} />
          )}
        </Suspense>
      </div>
    </QuizDetailsPage>
  )
}

export default McqPage
