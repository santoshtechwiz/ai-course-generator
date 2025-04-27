import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"

import { authOptions } from "@/lib/authOptions"
import { getQuiz } from "@/app/actions/getQuiz"
import { generatePageMetadata } from "@/lib/seo-utils"
import BlankQuizWrapper from "../components/BlankQuizWrapper"
import QuizDetailsPageWithContext from "../../components/QuizDetailsPageWithContext"

export async function generateMetadata({ params }: { params: Promise< { slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const quiz = await getQuiz(slug)

  if (!quiz) {
    return generatePageMetadata({
      title: "Fill in the Blanks Quiz Not Found | CourseAI",
      description:
        "The requested programming quiz could not be found. Explore our other coding challenges and assessments.",
      path: `/dashboard/blanks/${slug}`,
      noIndex: true,
    })
  }

  return generatePageMetadata({
    title: `${quiz.title} | Programming Fill in the Blanks Quiz`,
    description: `Test your coding knowledge with this ${quiz.title?.toLowerCase()} fill in the blanks quiz. Practice programming concepts and improve your skills.`,
    path: `/dashboard/blanks/${slug}`,
    keywords: [
      `${quiz.title?.toLowerCase()} quiz`,
      "programming fill in the blanks",
      "coding assessment",
      "developer knowledge test",
      "programming practice questions",
    ],
    ogType: "article",
  })
}

const BlanksPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id

  const result = await getQuiz(slug)
  if (!result) {
    notFound()
  }

  const questionCount = result.questions?.length || 5
  const estimatedTime = `PT${Math.max(10, Math.ceil(questionCount * 2))}M`

  const breadcrumbItems = [
    { name: "Home", href: baseUrl },
    { name: "Dashboard", href: `${baseUrl}/dashboard` },
    { name: "Quizzes", href: `${baseUrl}/dashboard/quizzes` },
    { name: result.title, href: `${baseUrl}/dashboard/blanks/${slug}` },
  ]

  return (
    <QuizDetailsPageWithContext
      title={result.title}
      description={`Test your coding knowledge on ${result.title} with fill in the blanks questions`}
      slug={slug}
      quizType="fill-blanks"
      questionCount={questionCount}
      estimatedTime={estimatedTime}
      breadcrumbItems={breadcrumbItems}
      quizId={result.id.toString()}
      authorId={result.userId}
      isPublic={false}
      isFavorite={false}
    >
      <BlankQuizWrapper quizData={result} slug={slug} />
    </QuizDetailsPageWithContext>
  )
}

export default BlanksPage
