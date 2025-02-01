import type { Metadata, ResolvingMetadata } from "next"
import { notFound } from "next/navigation"
import CodingQuiz from "../components/CodingQuiz"
import axios from "axios"
import type { CodingQuizProps } from "@/app/types"

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

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }:  PageProps, parent: ResolvingMetadata): Promise<Metadata> {
  const quizData = await getQuizData(params.slug)

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

export default async function Page({ params }: PageProps) {
  const quizData = await getQuizData(params.slug)

  if (!quizData) {
    return notFound()
  }

  return (
    <CodingQuiz
      quizId={quizData.quizId}
      slug={quizData.slug}
      isFavorite={quizData.isFavorite}
      isPublic={quizData.isPublic}
      userId={quizData.userId || ""}
      ownerId={quizData.ownerId || ""}
      quizData={quizData.quizData}
    />
  )
}

