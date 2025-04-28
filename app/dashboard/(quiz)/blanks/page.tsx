import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"

import { authOptions } from "@/lib/authOptions"
import { getQuiz } from "@/app/actions/getQuiz"
import { generateBreadcrumbStructuredData, generatePageMetadata, generateQuizStructuredData } from "@/lib/seo-utils"
import { JsonLd } from "@/components/json-ld"
import QuizDetailsPageWithContext from "../components/QuizDetailsPageWithContext"
import BlankQuizWrapper from "./components/BlankQuizWrapper"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
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

  const titleWords = quiz.title?.toLowerCase().split(" ") || []
  const keyTerms = titleWords.filter((word) => word.length > 3)

  return generatePageMetadata({
    title: `${quiz.title} | Interactive Fill in the Blanks Programming Quiz`,
    description: `Test your coding knowledge with this ${quiz.title?.toLowerCase()} fill in the blanks quiz. Practice completing code snippets, syntax, and programming concepts to improve your skills and memory recall. Perfect for reinforcing programming fundamentals.`,
    path: `/dashboard/blanks/${slug}`,
    keywords: [
      `${quiz.title?.toLowerCase()} quiz`,
      `${quiz.title?.toLowerCase()} practice`,
      `${quiz.title?.toLowerCase()} fill in the blanks`,
      "programming fill in the blanks",
      "coding assessment",
      "developer knowledge test",
      "programming practice questions",
      "code completion exercise",
      "syntax practice",
      "programming fundamentals",
      "interactive code learning",
      ...keyTerms.map((term) => `${term} programming practice`),
    ],
    ogType: "article",
    ogImage: `/api/og?title=${encodeURIComponent(quiz.title)}&description=${encodeURIComponent("Fill in the Blanks Programming Quiz")}`,
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

  // Generate structured data for SEO
  const quizStructuredData = generateQuizStructuredData({
    title: result.title,
    description: `Test your coding knowledge on ${result.title} with fill in the blanks questions`,
    url: `${baseUrl}/dashboard/blanks/${slug}`,
    questionCount,
    timeRequired: estimatedTime,
    author: "CourseAI",
    // datePublished: result.,
    // dateModified: result.updatedAt,
    quizType: "fill-blanks",
  })

  const breadcrumbStructuredData = generateBreadcrumbStructuredData(breadcrumbItems)

  return (
    <>
      <JsonLd type="quiz" data={quizStructuredData} />
      <JsonLd type="breadcrumb" data={breadcrumbStructuredData} />
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
    </>
  )
}

export default BlanksPage
