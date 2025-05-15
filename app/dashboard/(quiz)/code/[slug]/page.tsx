import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"

import { authOptions } from "@/lib/auth"
import { generatePageMetadata } from "@/lib/seo-utils"
import type { CodeQuizApiResponse, CodeQuizQuestion } from "@/app/types/code-quiz-types"

import type { BreadcrumbItem } from "@/app/types/types"
import QuizDetailsPageWithContext from "../../components/QuizDetailsPageWithContext"
import CodeQuizWrapper from "../components/CodeQuizWrapper"

interface PageParams {
  params: Promise<{ slug: string }>
}

// Improved type safety for quiz data
interface ValidatedQuizData {
  id: string
  quizId: string
  title: string
  slug: string
  isPublic: boolean
  isFavorite: boolean
  userId: string
  ownerId: string
  difficulty?: string
  questions: CodeQuizQuestion[]
}

async function getQuizData(slug: string): Promise<CodeQuizApiResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL || "http://localhost:3000"
    console.log(`Fetching quiz data from: ${baseUrl}/api/quizzes/code/${slug}`)

    const response = await fetch(`${baseUrl}/api/quizzes/code/${slug}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 0 }, // Ensure fresh data
    })

    if (response.status !== 200) {
      console.error(`Failed to fetch quiz data: ${response.status} ${response.statusText}`)
      return null
    }

    const data = await response.json()

    // Log detailed information about the response
    console.log("API response details:", {
      quizId: data.quizId,
      hasQuizData: Boolean(data.quizData),
      hasQuestions: Boolean(data.quizData?.questions),
      questionsIsArray: Array.isArray(data.quizData?.questions),
      questionCount: Array.isArray(data.quizData?.questions) ? data.quizData.questions.length : 0,
      firstQuestion: data.quizData?.questions?.[0]
        ? JSON.stringify(data.quizData.questions[0]).substring(0, 100) + "..."
        : "No questions",
      dataStructure: JSON.stringify(Object.keys(data)).substring(0, 100) + "...",
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

  console.log(`Fetching quiz data for slug: ${slug}`)

  // Fetch quiz data
  const result = await getQuizData(slug)

  // Handle missing quiz data
  if (!result) {
    console.error("Quiz data not found for slug:", slug)
    notFound()
  }

  // Validate quiz data structure with detailed logging
  if (!result.quizData) {
    console.error("Invalid quiz data structure: quizData is missing")
    notFound()
  }

  // Validate questions array with detailed logging
  if (!Array.isArray(result.quizData.questions)) {
    console.error("Invalid quiz data: questions is not an array", {
      questionsType: typeof result.quizData.questions,
      quizDataKeys: Object.keys(result.quizData),
    })
    notFound()
  }

  // Check if questions array is empty
  if (result.quizData.questions.length === 0) {
    console.error("Invalid quiz data: questions array is empty")
    notFound()
  }

  // Validate each question has required properties
  const invalidQuestions = result.quizData.questions.filter((q) => !q.question)
  if (invalidQuestions.length > 0) {
    console.error(`Found ${invalidQuestions.length} invalid questions without 'question' property`)
    notFound()
  }

  // Extract data from the nested structure
  const title = result.quizData.title || "Code Quiz"
  const questions = result.quizData.questions

  // Log detailed information about the questions
  console.log("Questions data:", {
    count: questions.length,
    hasQuestions: questions.length > 0,
    firstQuestion: questions.length > 0 ? JSON.stringify(questions[0]).substring(0, 100) + "..." : "No questions",
  })

  // Calculate estimated time based on question count and complexity
  const questionCount = questions.length
  const estimatedTime = `PT${Math.max(15, Math.ceil(questionCount * 10))}M`

  // Create breadcrumb items
  const breadcrumbItems: BreadcrumbItem[] = [
    { name: "Home", href: baseUrl },
    { name: "Dashboard", href: `${baseUrl}/dashboard` },
    { name: "Quizzes", href: `${baseUrl}/dashboard/quizzes` },
    { name: title, href: `${baseUrl}/dashboard/code/${slug}` },
  ]

  // Create a validated quiz data object with strict typing
  const validatedQuizData: ValidatedQuizData = {
    id: result.quizData.id || result.quizId || "",
    quizId: result.quizId || "",
    title: title,
    slug: slug,
    isPublic: Boolean(result.isPublic),
    isFavorite: Boolean(result.isFavorite),
    userId: currentUserId,
    ownerId: result.ownerId || "",
    difficulty: result.quizData.difficulty,
    // Ensure questions is a non-empty array
    questions: questions.map((q, index) => ({
      id: q.id || `question-${index}-${Math.random().toString(36).substring(2, 9)}`,
      question: q.question || "",
      codeSnippet: q.codeSnippet || "",
      options: Array.isArray(q.options) ? q.options : [],
      answer: q.answer || "",
      correctAnswer: q.correctAnswer || q.answer || "",
      language: q.language || "javascript",
    })),
  }

  // Final validation check before rendering
  if (validatedQuizData.questions.length === 0) {
    console.error("Validation failed: questions array is still empty after processing")
    notFound()
  }

  console.log("Rendering CodeQuizWrapper with validated data:", {
    title: validatedQuizData.title,
    questionCount: validatedQuizData.questions.length,
    firstQuestionId: validatedQuizData.questions[0].id,
  })

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
      isPublic={Boolean(result.isPublic)}
      isFavorite={Boolean(result.isFavorite)}
    >
      <CodeQuizWrapper
        quizData={validatedQuizData}
        slug={slug}
        userId={currentUserId}
        quizId={result.quizId}
        isPublic={Boolean(result.isPublic)}
        isFavorite={Boolean(result.isFavorite)}
        ownerId={result.ownerId}
      />
    </QuizDetailsPageWithContext>
  )
}

export default CodePage
