import { Suspense } from "react"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"
import { authOptions } from "@/lib/authOptions"
import { generatePageMetadata } from "@/lib/seo-utils"
import { getQuiz } from "@/app/actions/getQuiz"
import SlugPageLayout from "@/components/SlugPageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import RandomQuiz from "@/components/RanomQuiz"
import { BreadcrumbJsonLd } from "@/app/schema/breadcrumb-schema"
import QuizSchema from "@/app/schema/quiz-schema"
import BlankQuizWrapper from "@/components/features/blanks/BlankQuizWrapper"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
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
    title: `${quiz.topic} | Programming Fill in the Blanks Quiz`,
    description: `Test your coding knowledge with this ${quiz.topic.toLowerCase()} fill in the blanks quiz. Practice programming concepts and improve your skills.`,
    path: `/dashboard/blanks/${slug}`,
    keywords: [
      `${quiz.topic.toLowerCase()} quiz`,
      "programming fill in the blanks",
      "coding assessment",
      "developer knowledge test",
      "programming practice questions",
    ],
    ogType: "article",
  })
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-2/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-4/5" />
      </CardContent>
    </Card>
  )
}

export default async function BlankQuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id || ""
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"
  const { slug } = await params;
  const quiz = await getQuiz(slug)
  if (!quiz) {
    return null // This will be handled by Next.js to show the not-found page
  }

  // Calculate estimated time based on question count
  const questionCount = quiz.questions?.length || 5
  const estimatedTime = `PT${Math.max(10, Math.ceil(questionCount * 2))}M` // 2 minutes per question, minimum 10 minutes

  // Create breadcrumb items
  const breadcrumbItems = [
    { name: "Home", url: baseUrl },
    { name: "Dashboard", url: `${baseUrl}/dashboard` },
    { name: "Quizzes", url: `${baseUrl}/dashboard/quizzes` },
    { name: quiz.topic, url: `${baseUrl}/dashboard/blanks/${slug}` },
  ]

  return (
    <SlugPageLayout
      title={`Fill in the Blanks: ${quiz.topic}`}
      description={`Test your coding knowledge on ${quiz.topic} with fill in the blanks questions`}
      sidebar={<RandomQuiz />}
    >
      <QuizSchema
        quiz={{
          topic: quiz.topic,
          description: `Test your coding knowledge with this ${quiz.topic} fill in the blanks quiz. Practice programming concepts and improve your skills.`,
          questionCount: questionCount,
          estimatedTime: estimatedTime,
          level: "Intermediate",
          slug: slug,
        }}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Suspense fallback={<LoadingSkeleton />}>
        <Card>
          <CardHeader>
            <CardTitle>{quiz.topic}</CardTitle>
          </CardHeader>
          <CardContent>
            <BlankQuizWrapper slug={slug} />
          </CardContent>
        </Card>
      </Suspense>
    </SlugPageLayout>
  )
}

