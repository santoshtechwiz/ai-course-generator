import type { Metadata, ResolvingMetadata } from "next"
import { getAuthSession } from "@/lib/authOptions"
import axios from "axios"
import type { CodingQuizProps } from "@/app/types/types"
import CodeQuizWrapper from "@/components/features/code/CodeQuizWrapper"
import { QuizSkeleton } from "@/components/features/mcq/QuizSkeleton"
import AnimatedQuizHighlight from "@/components/RanomQuiz"
import { Suspense } from "react"
import SlugPageLayout from "@/components/SlugPageLayout"

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
    return {
      title: "Coding Quiz Not Found | CourseAI",
      description:
        "The requested programming quiz could not be found. Explore our other coding challenges and assessments.",
    }
  }

  const previousImages = (await parent).openGraph?.images || []
  const title = quizData.quizData.title || "Coding Challenge"

  return {
    title: `${title} | Programming Challenge`,
    description: `Test your coding skills with this ${title.toLowerCase()} programming challenge. Practice writing code and improve your development abilities.`,
    keywords: ["coding challenge", "programming practice", "code quiz", "developer assessment", "coding skills test"],
    openGraph: {
      title: `${title} | Interactive Coding Challenge`,
      description: `Enhance your programming skills with this interactive ${title.toLowerCase()} coding challenge. Write, test, and improve your code.`,
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/og?title=${encodeURIComponent(title)}`,
          width: 1200,
          height: 630,
          alt: `${title} Coding Challenge`,
        },
        ...previousImages,
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Programming Challenge`,
      description: `Test your coding skills with this ${title.toLowerCase()} programming challenge. Practice writing code and improve your development abilities.`,
      images: [`${process.env.NEXT_PUBLIC_APP_URL}/api/og?title=${encodeURIComponent(title)}`],
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

