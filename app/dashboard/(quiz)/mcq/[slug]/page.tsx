import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"

import { authOptions } from "@/lib/authOptions"
import getMcqQuestions from "@/app/actions/getMcqQuestions"
import { generatePageMetadata } from "@/lib/seo-utils"
import { QuizProvider } from "@/app/context/QuizContext"

import QuizDetailsPageWithContext from "../../components/QuizDetailsPageWithContext"
import McqQuizWrapper from "../components/McqQuizWrapper"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const quiz = await getMcqQuestions(slug)

  if (!quiz ) {
    return generatePageMetadata({
      title: "Multiple Choice Quiz Not Found | CourseAI",
      description:
        "The requested programming quiz could not be found. Explore our other coding challenges and assessments.",
      path: `/dashboard/mcq/${slug}`,
      noIndex: true,
    })
  }

  const quizData = quiz;

  return generatePageMetadata({
    title: `${quizData.title} | Programming Multiple Choice Quiz`,
    description: `Test your coding knowledge with this ${quizData.title?.toLowerCase()} multiple choice quiz. Practice programming concepts and improve your skills.`,
    path: `/dashboard/mcq/${slug}`,
    keywords: [
      `${quizData.title?.toLowerCase()} quiz`,
      "programming multiple choice",
      "coding assessment",
      "developer knowledge test",
      "programming practice questions",
    ],
    ogType: "article",
  })
}

const McqPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id

  // Fetch quiz data - this is the only API call we should make
  const result = await getMcqQuestions(slug)
  if (!result ) {
    console.error(`Quiz not found for slug: ${slug}`)
    notFound()
  }


  // Estimate quiz time based on question count
  const questionCount = result.questions.length
  const estimatedTime = `PT${Math.max(5, Math.min(60, questionCount * 2))}M`

  // Create breadcrumb items
  const breadcrumbItems = [
    { name: "Home", href: baseUrl },
    { name: "Dashboard", href: `${baseUrl}/dashboard` },
    { name: "Quizzes", href: `${baseUrl}/dashboard/quizzes` },
    { name: result.title, href: `${baseUrl}/dashboard/mcq/${slug}` },
  ]

  return (
    <QuizProvider>
      <QuizDetailsPageWithContext
        title={result.title}
        description={`Test your coding knowledge on ${result.title} with multiple choice questions`}
        slug={slug}
        quizType="mcq"
        questionCount={questionCount}
        estimatedTime={estimatedTime}
        breadcrumbItems={breadcrumbItems}
        quizId={result.id.toString()}
        authorId={result.userId}
        isPublic={result.isPublic || false}
        isFavorite={result.isFavorite || false}
        difficulty={
          ["easy", "medium", "hard"].includes(result.difficulty || "")
            ? (result.difficulty as "easy" | "medium" | "hard")
            : "medium"
        }
      >
        <McqQuizWrapper
          quizData={result}
     
          slug={slug}
        />
      </QuizDetailsPageWithContext>
      </QuizProvider>
  )
}

export default McqPage
