import type { Metadata, ResolvingMetadata } from "next"
import { notFound } from "next/navigation"
import { getQuiz } from "@/app/actions/getQuiz"
import OpenEndedQuizWrapper from "@/components/features/openended/OpenEndedQuizWrapper"
import AnimatedQuizHighlight from "@/components/RanomQuiz"
import QuizHeader from "@/components/shared/QuizHeader"



async function getQuizData(slug: string) {
  try {
    const data = await getQuiz(slug)
    return data
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
    title: `${quizData.topic} Quiz`,
    description: `Test your knowledge on ${quizData.topic} with this interactive quiz.`,
    openGraph: {
      title: `${quizData.topic} Quiz`,
      description: `Test your knowledge on ${quizData.topic} with this interactive quiz.`,
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/og?title=${encodeURIComponent(quizData.topic)}`,
          width: 1200,
          height: 630,
          alt: `${quizData.topic} Quiz`,
        },
        ...previousImages,
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${quizData.topic} Quiz`,
      description: `Test your knowledge on ${quizData.topic} with this interactive quiz.`,
      images: [`${process.env.NEXT_PUBLIC_APP_URL}/api/og?title=${encodeURIComponent(quizData.topic)}`],
    },
  }
}

const OpenEndedQuizPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const slug = (await params).slug
  const quizData = await getQuizData(slug)

  if (!quizData) {
    return notFound()
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <QuizHeader topic={quizData.topic} />
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <OpenEndedQuizWrapper slug={slug} quizData={quizData} />
        </div>
        <div className="lg:col-span-1">
          <AnimatedQuizHighlight />
        </div>
      </div>
    </div>
  )
}

export default OpenEndedQuizPage

