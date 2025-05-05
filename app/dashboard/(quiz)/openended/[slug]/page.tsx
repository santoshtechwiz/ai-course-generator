import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"
import { authOptions } from "@/lib/auth"
import { generatePageMetadata } from "@/lib/seo-utils"

import { getQuiz } from "@/app/actions/getQuiz"
import OpenEndedQuizWrapper from "../components/OpenEndedQuizWrapper"
import QuizDetailsPageWithContext from "../../components/QuizDetailsPageWithContext"

type Params = Promise<{ slug: string }>
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params
  const quizData = await getQuiz(slug)
  if (!quizData) {
    return generatePageMetadata({
      title: "Open-Ended Quiz Not Found | CourseAI",
      description:
        "The requested programming quiz could not be found. Explore our other coding challenges and assessments.",
      path: `/dashboard/openended/${slug}`,
      noIndex: true,
    })
  }

  return generatePageMetadata({
    title: `${quizData.title} | Open-Ended Programming Quiz`,
    description: `Develop your programming problem-solving skills with this ${quizData.title?.toLowerCase()} open-ended coding quiz. Enhance critical thinking.`,
    path: `/dashboard/openended/${slug}`,
    keywords: [
      "open-ended coding questions",
      "programming problem solving",
      "coding critical thinking",
      `${quizData.title?.toLowerCase()} practice`,
      "developer reasoning skills",
    ],
    ogType: "article",
  })
}

export default async function OpenEndedQuizPage({ params }: { params: Params }) {
  const { slug } = await params
  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id
  const quizData = await getQuiz(slug)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"

  if (!quizData) {
    notFound()
  }

  // Calculate estimated time based on question count
  const questionCount = quizData.questions?.length || 3
  const estimatedTime = `PT${Math.max(10, Math.ceil(questionCount * 5))}M` // 5 minutes per question, minimum 10 minutes

  // Create breadcrumb items
  const breadcrumbItems = [
    { name: "Home", href: baseUrl },
    { name: "Dashboard", href: `${baseUrl}/dashboard` },
    { name: "Quizzes", href: `${baseUrl}/dashboard/quizzes` },
    { name: quizData.title, href: `${baseUrl}/dashboard/openended/${slug}` },
  ]

  return (
    <QuizDetailsPageWithContext
      title={quizData.title}
      description={`Test your problem-solving skills with open-ended questions about ${quizData.title}`}
      slug={slug}
      quizType="openended"
      questionCount={questionCount}
      estimatedTime={estimatedTime}
      breadcrumbItems={breadcrumbItems}
      quizId={quizData.id.toString()}
      authorId={quizData.userId}
      isPublic={false}
      isFavorite={false}
    >
      <OpenEndedQuizWrapper slug={slug} quizData={quizData} />
    </QuizDetailsPageWithContext>
  )
}
