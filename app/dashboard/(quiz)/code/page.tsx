import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"

import { authOptions } from "@/lib/auth"
import { generateBreadcrumbStructuredData, generatePageMetadata, generateQuizStructuredData } from "@/lib/seo-utils"

import type { CodingQuizProps, BreadcrumbItem } from "@/app/types/types"
import { JsonLd } from "@/components/json-ld"
import QuizDetailsPageWithContext from "../components/QuizDetailsPageWithContext"
import CodeQuizWrapper from "./components/CodeQuizWrapper"


interface PageParams {
  params: Promise<{ slug: string }>
}

async function getQuizData(slug: string): Promise<CodingQuizProps | null> {
  try {
    const response = await fetch(`http://localhost:3000/api/code-quiz/${slug}`)
    if (response.status !== 200) {
      throw new Error(`Failed to fetch quiz data: ${response.statusText}`)
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

  const titleWords = quiz.title?.toLowerCase().split(" ") || []
  const keyTerms = titleWords.filter((word) => word.length > 3)
  const programmingLanguages = ["JavaScript", "Python", "Java", "C++", "TypeScript", "Ruby", "Go", "PHP"]

  // Extract any programming languages mentioned in the title
  const mentionedLanguages = programmingLanguages.filter((lang) =>
    quiz.title?.toLowerCase().includes(lang.toLowerCase()),
  )

  return generatePageMetadata({
    title: `${quiz.title} | Interactive Programming Code Challenge`,
    description: `Improve your coding skills with this ${quiz.title?.toLowerCase()} programming challenge. Write real code, get instant feedback, and enhance your development abilities with hands-on practice. Perfect for interview preparation and skill building.`,
    path: `/dashboard/code/${slug}`,
    keywords: [
      `${quiz.title?.toLowerCase()} challenge`,
      `${quiz.title?.toLowerCase()} coding exercise`,
      `${quiz.title?.toLowerCase()} programming practice`,
      "programming exercise",
      "coding practice",
      "developer skills test",
      "programming challenge",
      "interactive code editor",
      "coding interview preparation",
      "algorithm practice",
      "data structure exercise",
      ...mentionedLanguages.map((lang) => `${lang} programming challenge`),
      ...keyTerms.map((term) => `${term} coding exercise`),
    ],
    ogType: "article",
    ogImage: `/api/og?title=${encodeURIComponent(quiz.title)}&description=${encodeURIComponent("Interactive Code Challenge")}`,
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

  // Generate structured data for SEO
  const quizStructuredData = generateQuizStructuredData({
    title: result.quizData.title,
    description: `Test your coding skills on ${result.quizData.title} with interactive programming challenges`,
    url: `${baseUrl}/dashboard/code/${slug}`,
    questionCount,
    timeRequired: estimatedTime,
    author: "CourseAI",
    // datePublished: result.quizData.createdAt,
    // dateModified: result.quizData.updatedAt,
    quizType: "code",
  })

  const breadcrumbStructuredData = generateBreadcrumbStructuredData(breadcrumbItems)

  return (
    <>
      <JsonLd type="quiz" data={quizStructuredData} />
      <JsonLd type="breadcrumb" data={breadcrumbStructuredData} />
      <QuizDetailsPageWithContext
        title={result.quizData.title}
        description={`Test your coding skills on ${result.quizData.title} with interactive programming challenges`}
        slug={slug}
        quizType="code"
        questionCount={questionCount}
        estimatedTime={estimatedTime}
        breadcrumbItems={breadcrumbItems}
        quizId={result.quizId.toString()}
        authorId={result.ownerId}
        isPublic={result.isPublic || false}
        isFavorite={result.isFavorite || false}
      >
       <CodeQuizWrapper quizData={result.quizData} slug={slug} quizId={""} />
      </QuizDetailsPageWithContext>
    </>
  )
}

export default CodePage
