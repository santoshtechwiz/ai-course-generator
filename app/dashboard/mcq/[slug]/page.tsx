import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/authOptions"

import getMcqQuestions from "@/app/actions/getMcqQuestions"


import { generatePageMetadata } from "@/lib/seo-utils"
import McqQuizWrapper from "@/components/features/mcq/McqQuizWrapper"
import QuizDetailsPage from "@/components/QuizDetailsPage"
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"

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


  // Create breadcrumb items
  const breadcrumbItems = [
  
    { name: "Quizzes", url: `${baseUrl}/dashboard/quizzes` },
    { name: quizData.title, url: `${baseUrl}/dashboard/mcq/${slug}` },
  ];
  return (
    <QuizDetailsPage
      title={quizData.title}
      description={`Test your knowledge on ${quizData.title}`}
      slug={slug}
      quizType="mcq"
      questionCount={questions.length}
      estimatedTime="PT30M"
      breadcrumbItems={breadcrumbItems}
    >
      <McqQuizWrapper slug={slug} {title}={result.result.title} currentUserId={currentUserId} result={result} />
   </QuizDetailsPage>
  )
}

export default McqPage

