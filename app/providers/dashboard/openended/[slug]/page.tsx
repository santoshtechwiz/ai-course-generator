import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"
import { authOptions } from "@/lib/authOptions"
import SlugPageLayout from "@/components/SlugPageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import OpenEndedQuizWrapper from "@/components/features/openended/OpenEndedQuizWrapper"
import RandomQuiz from "@/components/RanomQuiz"
import { getQuiz } from "@/app/actions/getQuiz"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const quizData = await getQuiz(params.slug)
  if (!quizData) {
    return {
      title: "Open-Ended Quiz Not Found | CourseAI",
      description:
        "The requested programming quiz could not be found. Explore our other coding challenges and assessments.",
    }
  }

  const title = `${quizData.title} Open-Ended Quiz`
  const description = `Develop your programming problem-solving skills with this ${quizData.title.toLowerCase()} open-ended coding quiz. Enhance critical thinking.`

  return {
    title,
    description,
    keywords: [
      "open-ended coding questions",
      "programming problem solving",
      "coding critical thinking",
      `${quizData.title.toLowerCase()} practice`,
      "developer reasoning skills",
    ],
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
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
      title={`Open-Ended Quiz: ${quizData.title}`}
      description={`Test your programming knowledge on ${quizData.title}`}
      sidebar={<RandomQuiz />}
    >
      <Suspense fallback={<LoadingSkeleton />}>
        <Card>
          <CardHeader>
            <CardTitle>{quizData.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <OpenEndedQuizWrapper slug={params.slug} quizData={quizData} />
          </CardContent>
        </Card>
      </Suspense>
    </SlugPageLayout>
  )
}

