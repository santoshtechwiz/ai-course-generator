import type { Metadata, ResolvingMetadata } from "next"
import { notFound } from "next/navigation"
import { getAuthSession } from "@/lib/authOptions"
import axios from "axios"
import type { CodingQuizProps } from "@/app/types/types"
import CodeQuizWrapper from "@/components/features/code/CodeQuizWrapper"
import { QuizSkeleton } from "@/components/features/mcq/QuizSkeleton"
import AnimatedQuizHighlight from "@/components/RanomQuiz"
import { Suspense } from "react"
import SlugPageLayout from "@/components/shared/SlugPageLayout"

async function getQuizData(slug: string): Promise<CodingQuizProps | null> {
  try {
    const response = await axios.get<CodingQuizProps>(`${process.env.NEXTAUTH_URL}/api/code/${slug}`)
    if (response.status !== 200) {
      throw new Error("Failed to fetch quiz data")
    }
    return response.data
  } catch (error) {
    console.error("Error fetching quiz data:", error)
    return null
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const slug = (await params).slug
  const quizData = await getQuizData(slug)

  if (!quizData) {
    return notFound()
  }

  const previousImages = (await parent).openGraph?.images || []

  return {
    title: `${quizData.quizData.title} Quiz`,
    description: `Test your knowledge on ${quizData.quizData.title} with this interactive quiz.`,
    openGraph: {
      title: `${quizData.quizData.title} Quiz`,
      description: `Test your knowledge on ${quizData.quizData.title} with this interactive quiz.`,
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/og?title=${encodeURIComponent(quizData.quizData.title)}`,
          width: 1200,
          height: 630,
          alt: `${quizData.quizData.title} Quiz`,
        },
        ...previousImages,
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${quizData.quizData.title} Quiz`,
      description: `Test your knowledge on ${quizData.quizData.title} with this interactive quiz.`,
      images: [`${process.env.NEXT_PUBLIC_APP_URL}/api/og?title=${encodeURIComponent(quizData.quizData.title)}`],
    },
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const session = await getAuthSession()
  const slug = (await params).slug

  return (
    <SlugPageLayout sidebar={<AnimatedQuizHighlight />}>
      <Suspense fallback={<QuizSkeleton />}>
        <CodeQuizWrapper slug={slug} userId={session?.user?.id || ""} />
      </Suspense>
    </SlugPageLayout>
  )
}

