import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"

import { authOptions } from "@/lib/auth"
import { getQuiz } from "@/app/actions/getQuiz"
import { generatePageMetadata } from "@/lib/seo-utils"
import BlankQuizWrapper from "../components/BlankQuizWrapper"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
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
    title: `${quiz.title} | Fill in the Blanks Quiz`,
    description: `Test your coding knowledge with this ${quiz.title?.toLowerCase()} fill in the blanks quiz. Practice programming concepts and improve your skills.`,
    path: `/dashboard/blanks/${slug}`,
    keywords: [
      `${quiz.title?.toLowerCase()} quiz`,
      "programming fill in the blanks",
      "coding assessment",
      "developer knowledge test",
      "programming practice questions",
    ],
    ogType: "article",
  })
}

export default async function BlanksPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getServerSession(authOptions)

  const result = await getQuiz(slug)
  if (!result?.id) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BlankQuizWrapper quizData={result} slug={slug} />
    </div>
  )
}
