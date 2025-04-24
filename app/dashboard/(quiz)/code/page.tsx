import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"

import { authOptions } from "@/lib/authOptions"
import { getQuiz } from "@/app/actions/getQuiz"
import { generatePageMetadata } from "@/lib/seo-utils"
import QuizDetailsPageWithContext from "../components/QuizDetailsPageWithContext"
import CodeQuizWrapper from "./components/CodeQuizWrapper"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
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
    title: `${quiz.title} | Programming Code Challenge`,
    description: `Test your coding skills with this ${quiz.title?.toLowerCase()} programming challenge. Practice writing real code and improve your development abilities.`,
    path: `/dashboard/code/${slug}`,
    keywords: [
      `${quiz.title?.toLowerCase()} challenge`,
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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

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
    { name: "Home", href: baseUrl },
    { name: "Dashboard", href: `${baseUrl}/dashboard` },
    { name: "Quizzes", href: `${baseUrl}/dashboard/quizzes` },
    { name: result.title, href: `${baseUrl}/dashboard/code/${slug}` },
  ]

  return (
    <QuizDetailsPageWithContext
      title={result.title}
      description={`Test your coding skills on ${result.title} with interactive programming challenges`}
      slug={slug}
      quizType="code"
      questionCount={questionCount}
      estimatedTime={estimatedTime}
      breadcrumbItems={breadcrumbItems}
      quizId={result.id.toString()}
      authorId={result.userId}
      isPublic={result.isPublic || false}
      isFavorite={result.isFavorite || false}
      difficulty={result.difficulty || "medium"}
    >
      <CodeQuizWrapper quizData={result} slug={slug} userId={currentUserId || ""} />
    </QuizDetailsPageWithContext>
  )
}

export default CodePage
