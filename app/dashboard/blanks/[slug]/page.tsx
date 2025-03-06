import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"

import { authOptions } from "@/lib/authOptions"
import { getQuiz } from "@/app/actions/getQuiz"
import { generatePageMetadata } from "@/lib/seo-utils"

import { BlankQuizWrapper } from "@/components/features/blanks/BlankQuizWrapper"
import SlugPageLayout from "@/components/SlugPageLayout"

import { QuizSkeleton } from "@/components/features/mcq/QuizSkeleton"
import AnimatedQuizHighlight from "@/components/RanomQuiz"
type Params = Promise<{ slug: string }>;
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const quiz = await getQuiz(slug)

  if (!quiz) {
    return {
      title: "Fill in the Blanks Quiz Not Found | CourseAI",
      description:
        "The requested programming quiz could not be found. Explore our other coding challenges and assessments.",
    }
  }

  return generatePageMetadata({
    title: `${quiz.topic} | Programming Fill in the Blanks Quiz`,
    description: `Test your coding knowledge with this ${quiz.topic.toLowerCase()} fill in the blanks quiz. Practice programming concepts and improve your skills.`,
    path: `/dashboard/blanks/${slug}`,
    keywords: [
      `${quiz.topic.toLowerCase()} quiz`,
      "programming fill in the blanks",
      "coding assessment",
      "developer knowledge test",
      "programming practice questions",
    ],
    ogType: "article",
  })
}

const BlanksPage = async (props: { params: Promise<{ slug: string }> }) => {
  const params = await props.params
  const { slug } = params
  
  const result = await getQuiz(slug)
  if (!result) {
    notFound()
  }




  return (
    <SlugPageLayout
      title={result.topic}
      description={`Test your coding knowledge on ${result.topic} with fill in the blanks questions`}
      sidebar={<AnimatedQuizHighlight />}
    >

      <Suspense fallback={<QuizSkeleton />}>
        <BlankQuizWrapper slug={slug} />
      </Suspense>
    </SlugPageLayout>
  )
}

export default BlanksPage

