import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"
import { authOptions } from "@/lib/authOptions"
import { generatePageMetadata } from "@/lib/seo-utils"
import SlugPageLayout from "@/components/SlugPageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import OpenEndedQuizWrapper from "@/components/features/openended/OpenEndedQuizWrapper"
import AnimatedQuizHighlight from "@/components/RanomQuiz"
import { getQuiz } from "@/app/actions/getQuiz"

import { BreadcrumbJsonLd } from "@/app/schema/breadcrumb-schema"
import QuizSchema from "@/app/schema/quiz-schema"
type Params=Promise<{slug:string}>;
export async function generateMetadata({ params }: { params:Params }): Promise<Metadata> {
  const {slug}=await params;
  const quizData = await getQuiz(slug)
  if (!quizData) {
    return generatePageMetadata({
      title: "Open-Ended Quiz Not Found | CourseAI",
      description:
        "The requested programming quiz could not be found. Explore our other coding challenges and assessments.",
      path: `/dashboard/openended/${slug}`,
      noIndex: true,
    })
  }

  return generatePageMetadata({
    title: `${quizData.topic} | Open-Ended Programming Quiz`,
    description: `Develop your programming problem-solving skills with this ${quizData.topic.toLowerCase()} open-ended coding quiz. Enhance critical thinking.`,
    path: `/dashboard/openended/${slug}`,
    keywords: [
      "open-ended coding questions",
      "programming problem solving",
      "coding critical thinking",
      `${quizData.topic.toLowerCase()} practice`,
      "developer reasoning skills",
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

export default async function OpenEndedQuizPage({ params }: { params: Params }) {
  const { slug } =await params;
  const session = await getServerSession(authOptions)
  const quizData = await getQuiz(slug)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"

  if (!quizData) {
    notFound()
  }

  // Calculate estimated time based on question count
  const questionCount = quizData.questions?.length || 3
  const estimatedTime = `PT${Math.max(10, Math.ceil(questionCount * 5))}M` // 5 minutes per question, minimum 10 minutes

  // Create breadcrumb items
  const breadcrumbItems = [
    { name: "Home", url: baseUrl },
    { name: "Dashboard", url: `${baseUrl}/dashboard` },
    { name: "Quizzes", url: `${baseUrl}/dashboard/quizzes` },
    { name: quizData.topic, url: `${baseUrl}/dashboard/openended/${slug}` },
  ]

  return (
    <SlugPageLayout
      title={`Open-Ended Quiz: ${quizData.topic}`}
      description={`Test your knowledge on ${quizData.topic}`}
      sidebar={<AnimatedQuizHighlight />}
    >
      <QuizSchema
        quiz={{
          topic: quizData.topic,
          description: `Develop your programming problem-solving skills with this ${quizData.topic.toLowerCase()} open-ended coding quiz. Enhance critical thinking.`,
          questionCount: questionCount,
          estimatedTime: estimatedTime,
          level:  "Intermediate",
          slug: slug,
        }}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />
      <Suspense fallback={<LoadingSkeleton />}>
        <Card>
          <CardHeader>
            <CardTitle>{quizData.topic}</CardTitle>
          </CardHeader>
          <CardContent>
            <OpenEndedQuizWrapper slug={slug} quizData={quizData} />
          </CardContent>
        </Card>
      </Suspense>
    </SlugPageLayout>
  )
}

