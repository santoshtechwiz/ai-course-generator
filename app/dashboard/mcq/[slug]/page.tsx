import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"
import { Suspense } from "react"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/authOptions"
import getMcqQuestions from "@/app/actions/getMcqQuestions"
import { generatePageMetadata } from "@/lib/seo-utils"
import QuizDetailsPage from "@/components/QuizDetailsPage"
import { QuizActions } from "@/components/QuizActions"
import { QuizSkeleton } from "@/components/features/mcq/QuizSkeleton"
import McqQuiz from "@/components/features/mcq/McqQuiz"
import QuizSchema from "@/app/schema/quiz-schema"
import BreadcrumbSchema from "@/app/schema/breadcrumb-schema"

// SEO metadata generation
export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params

  const quiz = await prisma.userQuiz.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      questions: true,
      user: { select: { name: true } },
    

    },
  })

  if (!quiz) {
    return generatePageMetadata({
      title: "Quiz Not Found | Programming MCQs",
      description:
        "The requested programming quiz could not be found. Explore our other coding quizzes and learning resources.",
      path: `/dashboard/mcq/${slug}`,
      noIndex: true,
    })
  }

  // Extract programming-related keywords from the title
  const titleWords = quiz.title.toLowerCase().split(" ")
  const programmingLanguages = [
    "javascript",
    "python",
    "java",
    "typescript",
    "c++",
    "c#",
    "php",
    "ruby",
    "go",
    "rust",
    "swift",
  ]
  const programmingConcepts = [
    "algorithm",
    "data structure",
    "function",
    "variable",
    "class",
    "object",
    "inheritance",
    "api",
    "framework",
    "library",
  ]

  // Find programming languages or concepts in the title
  const detectedLanguages = programmingLanguages.filter(
    (lang) => titleWords.includes(lang) || quiz.title.toLowerCase().includes(lang),
  )

  const detectedConcepts = programmingConcepts.filter((concept) => quiz.title.toLowerCase().includes(concept))

  // Create SEO-optimized title
  let seoTitle = `${quiz.title} Programming Quiz | Coding MCQ Test`
  if (detectedLanguages.length > 0) {
    seoTitle = `${quiz.title} Quiz | ${detectedLanguages[0].charAt(0).toUpperCase() + detectedLanguages[0].slice(1)} Programming MCQs`
  }

  // Create enhanced description
  const questionCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0
  const enhancedDescription = quiz.title
    ? `${quiz.title}... Test your knowledge with this ${quiz.title} quiz. Created by ${quiz.user?.name || "CourseAI"}.`
    : `Master ${quiz.title} with this interactive coding quiz. Perfect for interview prep and skill assessment. Created by ${quiz.user?.name }.`

  // Generate keywords based on quiz content
  const keywordsList = [
    quiz.title.toLowerCase(),
    `${quiz.title.toLowerCase()} quiz`,
    `${quiz.title.toLowerCase()} test`,
    `${quiz.title.toLowerCase()} mcq`,
    `${quiz.title.toLowerCase()} multiple choice`,
    `${quiz.title.toLowerCase()} practice questions`,
    "programming quiz",
    "coding test",
    "developer assessment",
    "programming mcq",
    "coding practice",
    "technical interview prep",
    ...detectedLanguages.map((lang) => `${lang} quiz`),
    ...detectedLanguages.map((lang) => `${lang} programming test`),
    ...detectedConcepts.map((concept) => `${concept} quiz`),
   
  ]

  // Create enhanced OG image URL with more context
  const ogImage = `/api/og?title=${encodeURIComponent(quiz.title)}&subtitle=${encodeURIComponent("Interactive Programming Quiz")}`

  return generatePageMetadata({
    title: seoTitle,
    description: enhancedDescription,
    path: `/dashboard/mcq/${slug}`,
    keywords: keywordsList,
    ogImage,
    ogType: "article",
  })
}

// Generate static paths for common quizzes
export async function generateStaticParams() {
  const quizzes = await prisma.userQuiz.findMany({
    where: {
      isPublic: true,
      // Prioritize quizzes with more completions or views if you track those
    },
    select: { slug: true },
    take: 100, // Limit to most popular/recent quizzes
    orderBy: {
      createdAt: "desc", // Or order by popularity if you track that
    },
  })

  return quizzes.filter((quiz) => quiz.slug).map((quiz) => ({ slug: quiz.slug }))
}

const McqPage = async (props: { params: Promise<{ slug: string }> }) => {
  const { slug } = await props.params
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.io"

  // Get current user session
  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id || ""

  // Fetch quiz data
  const result = await getMcqQuestions(slug)
  if (!result || !result.result) {
    notFound()
  }

  const { result: quizData, questions = [] } = result

  // Create breadcrumb items with more specific paths
  const breadcrumbItems = [
    { name: "Home", url: baseUrl },
    { name: "Dashboard", url: `${baseUrl}/dashboard` },
    { name: "MCQ Quizzes", url: `${baseUrl}/dashboard/quizzes?type=mcq` },
    { name: quizData.title || "Quiz", url: `${baseUrl}/dashboard/mcq/${slug}` },
  ]

  // Calculate estimated time based on question count (30 seconds per question + 5 minutes buffer)
  const questionCount = Array.isArray(questions) ? questions.length : 0
  const estimatedMinutes = Math.max(5, Math.ceil((questionCount * 30) / 60) + 5)
  const estimatedTime = `PT${estimatedMinutes}M`

  // Enhanced description with more context
  const enhancedDescription = `Test your knowledge on ${quizData.title || "programming concepts"} with this interactive multiple-choice quiz. Perfect for assessing your understanding and preparing for technical interviews.`

  return (
    <>
      {/* Add structured data for Quiz */}
      <QuizSchema
      quiz={{
        title: quizData.title || "Programming Quiz",
        description: enhancedDescription,
        url: `${baseUrl}/dashboard/mcq/${slug}`,
        questionCount: questionCount,
      }}
      />

      {/* Add structured data for Breadcrumbs */}
      <BreadcrumbSchema items={breadcrumbItems} />

      <QuizDetailsPage
        title={quizData.title || "Programming Quiz"}
        description={enhancedDescription}
        slug={slug}
        quizType="mcq"
        questionCount={questionCount}
        estimatedTime={estimatedTime}
        breadcrumbItems={breadcrumbItems}
      >
        <div className="flex flex-col gap-8">
          {/* Quiz Actions Component */}
          <QuizActions
            quizId={quizData.id?.toString() || ""}
            userId={currentUserId}
            ownerId={quizData.userId || ""}
            quizSlug={quizData.slug || ""}
            initialIsPublic={quizData.isPublic || false}
            initialIsFavorite={quizData.isFavorite || false}
            quizType="mcq"
            position="left-center"
          />

          {/* Quiz Content with Suspense */}
          <Suspense fallback={<QuizSkeleton />}>
            {Array.isArray(questions) && questions.length > 0 ? (
              <McqQuiz
                questions={questions}
                title={quizData.title || "Programming Quiz"}
                quizId={Number(quizData.id) || 0}
                slug={slug}
              />
            ) : (
              <div className="p-8 text-center">
                <h2 className="text-xl font-semibold mb-4">No questions available</h2>
                <p className="text-muted-foreground">
                  This quiz doesn't have any questions yet. Check back later or explore other quizzes.
                </p>
              </div>
            )}
          </Suspense>
        </div>
      </QuizDetailsPage>
    </>
  )
}

export default McqPage

