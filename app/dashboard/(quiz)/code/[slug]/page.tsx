import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"

import { authOptions } from "@/lib/authOptions"
import { generatePageMetadata } from "@/lib/seo-utils"
import { QuizType } from "@/app/types/quiz-types"
import type { CodeQuizApiResponse } from "@/app/types/code-quiz-types"

import type { BreadcrumbItem } from "@/app/types/types"
import QuizDetailsPageWithContext from "../../components/QuizDetailsPageWithContext"
import CodeQuizWrapper from "../components/CodeQuizWrapper"

interface PageParams {
  params: Promise<{ slug: string }>
}

async function getQuizData(slug: string): Promise<CodeQuizApiResponse | null> {
  try {
    // Use absolute URL for server-side fetching
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/code-quiz/${slug}`, {
      cache: "no-store", // Ensure we get fresh data
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.status !== 200) {
      console.error(`Failed to fetch quiz data: ${response.statusText}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching quiz data:", error)
    return null
  }
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = await params
  const quiz = await getQuizData(slug)

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
    title: `${quiz.quizData.title} | Programming Code Challenge`,
    description: `Test your coding skills with this ${quiz.quizData.title?.toLowerCase()} programming challenge. Practice writing real code and improve your development abilities.`,
    path: `/dashboard/code/${slug}`,
    keywords: [
      `${quiz.quizData.title?.toLowerCase()} challenge`,
      "programming exercise",
      "coding practice",
      "developer skills test",
      "programming challenge",
    ],
    ogType: "article",
  })
}

const CodePage = async (props: PageParams) => {
  const params = await props.params
  const { slug } = params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id || ""

  const result = await getQuizData(slug)
  if (!result) {
    notFound()
  }

  // Calculate estimated time based on question count and complexity
  const questionCount = result.quizData.questions?.length || 3
  const estimatedTime = `PT${Math.max(15, Math.ceil(questionCount * 10))}M` // 10 minutes per coding question, minimum 15 minutes

  // Create breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { name: "Home", href: baseUrl },
    { name: "Dashboard", href: `${baseUrl}/dashboard` },
    { name: "Quizzes", href: `${baseUrl}/dashboard/quizzes` },
    { name: result.quizData.title, href: `${baseUrl}/dashboard/code/${slug}` },
  ]

  return (
    <QuizDetailsPageWithContext
      title={result.quizData.title}
      description={`Test your coding skills on ${result.quizData.title} with interactive programming challenges`}
      slug={slug}
      quizType={QuizType.CODE}
      questionCount={questionCount}
      estimatedTime={estimatedTime}
      breadcrumbItems={breadcrumbItems}
      quizId={result.quizId}
      authorId={result.ownerId}
      isPublic={result.isPublic || false}
      isFavorite={result.isFavorite || false}
    >
      <CodeQuizWrapper
        quizData={result.quizData}
        slug={slug}
        userId={currentUserId}
        quizId={result.quizId}
        isPublic={result.isPublic}
        isFavorite={result.isFavorite}
        ownerId={result.ownerId}
      />
    </QuizDetailsPageWithContext>
  )
}

export default CodePage
