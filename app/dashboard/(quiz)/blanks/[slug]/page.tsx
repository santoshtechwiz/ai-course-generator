import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"

import { authOptions } from "@/lib/auth"
import { getQuiz } from "@/app/actions/getQuiz"
import { generateBreadcrumbStructuredData, generatePageMetadata, generateQuizStructuredData } from "@/lib/seo-utils"
import { JsonLd } from "@/components/json-ld"
import QuizDetailsPageWithContext from "../../components/QuizDetailsPageWithContext"
import { BlankQuizWrapper } from "../components/BlankQuizWrapper"


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

  // Fetch quiz data
  const quizData = await getQuiz(slug)

  // Handle 404 case
  if (!quizData) {
    notFound()
  }
  
  // Make sure quizData has the required structure and ensure questions is an array
  const processedQuizData = {
    ...quizData,
    id: quizData.id || slug,
    slug: slug,
    title: quizData.title || "Fill in the Blanks Quiz",
    questions: Array.isArray(quizData.questions) ? quizData.questions : []
  }

  const questionCount = processedQuizData.questions?.length || 0
  const estimatedTime = `PT${Math.max(10, Math.ceil(questionCount * 2))}M`

  const breadcrumbItems = [
    { name: "Home", href: baseUrl },
    { name: "Dashboard", href: `${baseUrl}/dashboard` },
    { name: "Quizzes", href: `${baseUrl}/dashboard/quizzes` },
    { name: processedQuizData.title, href: `${baseUrl}/dashboard/blanks/${slug}` },
  ]

  // Generate structured data for SEO
  const quizStructuredData = generateQuizStructuredData({
    title: processedQuizData.title,
    description: `Test your coding knowledge on ${processedQuizData.title} with fill in the blanks questions`,
    url: `${baseUrl}/dashboard/blanks/${slug}`,
    questionCount,
    timeRequired: estimatedTime,
    author: "CourseAI",
    quizType: "fill-blanks",
  })

  const breadcrumbStructuredData = generateBreadcrumbStructuredData(breadcrumbItems)

  return (
    <>
      <JsonLd type="quiz" data={quizStructuredData} />
      <JsonLd type="breadcrumb" data={breadcrumbStructuredData} />
      <QuizDetailsPageWithContext
        title={processedQuizData.title}
        description={`Test your coding knowledge on ${processedQuizData.title} with fill in the blanks questions`}
        slug={slug}
        quizType="blanks"
        questionCount={questionCount}
        estimatedTime={estimatedTime}
        breadcrumbItems={breadcrumbItems}
        quizId={processedQuizData.id.toString()}
        authorId={processedQuizData.userId || currentUserId || "anonymous"}
        isPublic={false}
        isFavorite={false}
      >
        <BlankQuizWrapper quizData={processedQuizData} slug={slug} />
      </QuizDetailsPageWithContext>
    </>
  )
}

export default BlanksPage
