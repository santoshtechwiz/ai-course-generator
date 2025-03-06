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
import QuizSchema from "@/app/schema/quiz-schema"


export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const quizData = await getQuiz(params.slug)
  if (!quizData) {
    return generatePageMetadata({
      title: "Open-Ended Quiz Not Found | CourseAI",
      description:
        "The requested programming quiz could not be found. Explore our other coding challenges and assessments.",
      path: `/dashboard/openended/${params.slug}`,
      noIndex: true,
    })
  }

  return generatePageMetadata({
    title: `${quizData.topic} | Open-Ended Programming Quiz`,
    description: `Develop your programming problem-solving skills with this ${quizData.topic.toLowerCase()} open-ended coding quiz. Enhance critical thinking.`,
    path: `/dashboard/openended/${params.slug}`,
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

export default async function OpenEndedQuizPage({ params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions)
  const quizData = await getQuiz(params.slug)

  if (!quizData) {
    notFound()
  }

  return (
    <SlugPageLayout
      title={`Open-Ended Quiz: ${quizData.topic}`}
      description={`Test your knowledge on ${quizData.topic}`}
      sidebar={<AnimatedQuizHighlight />}
    >
      <QuizSchema
        quiz={{
          topic: quizData.topic,
          description: `Test your knowledge on ${quizData.topic} with this open-ended programming quiz.`,
          questionCount: quizData.questions?.length || 5,
          estimatedTime: "PT20M", // 20 minutes in ISO 8601 duration format
          level: "Intermediate",
          slug: params.slug,
        }}
      />
      <Suspense fallback={<LoadingSkeleton />}>
        <Card>
          <CardHeader>
            <CardTitle>{quizData.topic}</CardTitle>
          </CardHeader>
          <CardContent>
            <OpenEndedQuizWrapper slug={params.slug} quizData={quizData} />
          </CardContent>
        </Card>
      </Suspense>
    </SlugPageLayout>
  )
}

