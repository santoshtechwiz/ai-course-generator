import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"

import { authOptions } from "@/lib/auth"
import { generatePageMetadata } from "@/lib/seo-utils"
import type { CodeQuizApiResponse } from "@/app/types/code-quiz-types"
import CodeQuizResultsPageWrapper from "../../components/CodeQuizResultsPageWrapper"

interface PageParams {
  params: { slug: string }
}

/**
 * Fetches quiz data from the API
 */
async function getQuizData(slug: string): Promise<CodeQuizApiResponse | null> {
  try {
    if (!slug) {
      console.error("Invalid slug provided to getQuizData")
      return null
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/code-quiz/${slug}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch quiz data: ${response.status} ${response.statusText}`)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching quiz data:", error)
    return null
  }
}

/**
 * Generates metadata for the results page
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { slug } = params
  const quiz = await getQuizData(slug)

  if (!quiz) {
    return generatePageMetadata({
      title: "Quiz Results Not Found | CourseAI",
      description: "The requested quiz results could not be found.",
      path: `/dashboard/code/${slug}/results`,
      noIndex: true,
    })
  }

  const title = quiz.quizData?.title || "Code Quiz"

  return generatePageMetadata({
    title: `${title} Results | CourseAI`,
    description: `View your results for the ${title} coding challenge.`,
    path: `/dashboard/code/${slug}/results`,
    keywords: ["quiz results", "coding challenge", "performance review", title.toLowerCase()],
    ogType: "article",
  })
}

/**
 * Results page component
 */
export default async function CodeQuizResultsPage({ params }: { params: { slug: string } }) {
  const { slug } = params

  if (!slug) {
    notFound()
  }

  // Get the current user session
  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id || ""

  // Fetch quiz data for metadata
  const quizData = await getQuizData(slug)

  if (!quizData) {
    notFound()
  }

  return <CodeQuizResultsPageWrapper slug={slug} userId={currentUserId} quizId={quizData.quizId} />
}
