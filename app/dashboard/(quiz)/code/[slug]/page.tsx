import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"

import { authOptions } from "@/lib/auth"
import { generatePageMetadata } from "@/lib/seo-utils"
import type { CodeQuizApiResponse } from "@/app/types/code-quiz-types"

import type { BreadcrumbItem } from "@/app/types/types"
import QuizDetailsPageWithContext from "../../components/QuizDetailsPageWithContext"
import CodeQuizWrapper from "../components/CodeQuizWrapper"

interface PageParams {
  params: Promise<{ slug: string }>
}

async function getQuizData(slug: string): Promise<CodeQuizApiResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/code-quiz/${slug}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (response.status !== 200) {
      console.error(`Failed to fetch quiz data: ${response.statusText}`)
      return null
    }

    const data = await response.json()
    console.log("API response:", {
      quizId: data.quizId,
      hasNestedData: Boolean(data.quizData),
      questionCount: data.quizData?.questions?.length || 0,
      firstQuestion: data.quizData?.questions?.[0]
        ? JSON.stringify(data.quizData.questions[0]).substring(0, 100) + "..."
        : "No questions",
    })

    return data
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

  const title = quiz.quizData?.title || "Code Challenge"

  return generatePageMetadata({
    title: `${title} | Programming Code Challenge`,
    description: `Test your coding skills with this ${title.toLowerCase()} programming challenge. Practice writing real code and improve your development abilities.`,
    path: `/dashboard/code/${slug}`,
    keywords: [
      `${title.toLowerCase()} challenge`,
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

  // Get the current user session
  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id || ""

  // Fetch quiz data
  const result = await getQuizData(slug)
  if (!result) {
    console.error("Quiz data not found for slug:", slug)
    notFound()
  }

  // Validate quiz data structure
  if (!result.quizData || !Array.isArray(result.quizData.questions) || result.quizData.questions.length === 0) {
    console.error("Invalid or empty quiz data structure:", JSON.stringify(result).substring(0, 200) + "...")
    notFound()
  }

  // Extract data from the nested structure
  const title = result.quizData?.title || "Code Quiz"
  const questions = result.quizData?.questions || []

  // Log detailed information about the questions
  console.log("Questions data:", {
    count: questions.length,
    hasQuestions: questions.length > 0,
    firstQuestion: questions.length > 0 ? JSON.stringify(questions[0]).substring(0, 100) + "..." : "No questions",
  })

  // Calculate estimated time based on question count and complexity
  const questionCount = questions.length || 0
  const estimatedTime = `PT${Math.max(15, Math.ceil(questionCount * 10))}M`

  // Create breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { name: "Home", href: baseUrl },
    { name: "Dashboard", href: `${baseUrl}/dashboard` },
    { name: "Quizzes", href: `${baseUrl}/dashboard/quizzes` },
    { name: title, href: `${baseUrl}/dashboard/code/${slug}` },
  ]

  return (
    <QuizDetailsPageWithContext
      title={title}
      description={`Test your coding skills on ${title} with interactive programming challenges`}
      slug={slug}
      quizType="code"
      questionCount={questionCount}
      estimatedTime={estimatedTime}
      breadcrumbItems={breadcrumbItems}
      quizId={result.quizId}
      authorId={result.ownerId}
      isPublic={result.isPublic || false}
      isFavorite={result.isFavorite || false}
    >
      <CodeQuizWrapper
        quizData={{
      
          id: result.quizData?.id || "",
          title: result.quizData?.title || "",
          slug: slug,
          isPublic: result.isPublic || false,
          isFavorite: result.isFavorite || false,
          userId: currentUserId,
          ownerId: result.ownerId || "",
          difficulty: result.quizData?.difficulty,
          questions: questions, // Ensure questions are passed correctly
        }}
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
