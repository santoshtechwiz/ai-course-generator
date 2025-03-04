import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"
import { authOptions } from "@/lib/authOptions"
import SlugPageLayout from "@/components/SlugPageLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import OpenEndedQuizWrapper from "@/components/features/openended/OpenEndedQuizWrapper"
import AnimatedQuizHighlight from "@/components/RanomQuiz"
import { getQuiz } from "@/app/actions/getQuiz"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const quizData = await getQuiz(params.slug)
  if (!quizData) {
    return {
      title: "Quiz Not Found",
      description: "The requested quiz could not be found.",
    }
  }

  const title = `${quizData.topic} Quiz`
  const description = `Test your knowledge with this ${quizData.topic} open-ended quiz.`

  return {
    title,
    description,
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
      title={`Open-Ended Quiz: ${quizData.topic}`}
      description={`Test your knowledge on ${quizData.topic}`}
      sidebar={<AnimatedQuizHighlight />}
    >
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

