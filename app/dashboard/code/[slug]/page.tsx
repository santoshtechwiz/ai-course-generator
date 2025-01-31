import type { Metadata, ResolvingMetadata } from "next"
import { notFound } from "next/navigation"
import CodingQuiz from "../components/CodingQuiz"

async function getQuizData(slug: string) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/code/${slug}`)
    if (!response.ok) {
      throw new Error("Failed to fetch quiz data")
    }
    return await response.json()
  } catch (error) {
    console.error("Error fetching quiz data:", error)
    return null
  }
}

export async function generateMetadata(
  { params }: { params: { slug: string } },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const quizData = await getQuizData(params.slug)

  if (!quizData) {
    return notFound()
  }

  const previousImages = (await parent).openGraph?.images || []

  return {
    title: `${quizData.title} Quiz`,
    description: `Test your knowledge on ${quizData.title} with this interactive quiz.`,
    openGraph: {
      title: `${quizData.title} Quiz`,
      description: `Test your knowledge on ${quizData.title} with this interactive quiz.`,
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/og?title=${encodeURIComponent(quizData.title)}`,
          width: 1200,
          height: 630,
          alt: `${quizData.title} Quiz`,
        },
        ...previousImages,
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${quizData.title} Quiz`,
      description: `Test your knowledge on ${quizData.title} with this interactive quiz.`,
      images: [`${process.env.NEXT_PUBLIC_APP_URL}/api/og?title=${encodeURIComponent(quizData.title)}`],
    },
  }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const {slug}= await params;
  const quizData = await getQuizData(slug)

  if (!quizData) {
    return notFound()
  }

  return <CodingQuiz quizData={quizData} />
}

