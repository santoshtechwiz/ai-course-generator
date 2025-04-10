import { Suspense } from "react"
import type { Metadata } from "next"
import { getAuthSession } from "@/lib/authOptions"

import { getQuizzes } from "@/app/actions/getQuizes"
import { QuizzesClient } from "@/components/features/quizzes/QuizzesClient"
import { QuizzesSkeleton } from "@/components/features/quizzes/QuizzesSkeleton"
import { JsonLd } from "@/app/schema/components/json-ld"
import { generatePageMetadata } from "@/lib/seo-utils"

export const metadata: Metadata = generatePageMetadata({
  title: "Free Quizzes – MCQs,Open-ended and Code Challenges",
  description: "Discover a variety of interactive quizzes to test and enhance your programming knowledge and skills.",
  path: "/dashboard/quizzes",
  keywords: [
    "programming quizzes",
    "coding tests",
    "developer assessments",
    "interactive quizzes",
    "tech knowledge tests",
    "coding challenges",
    "programming practice",
    "code exercises",
    "developer quiz",
    "learning assessment",
  ],
  ogType: "website",
})

export const dynamic = "force-dynamic"

const QuizPage = async () => {
  const session = await getAuthSession()
  const userId = session?.user?.id
  const initialQuizzesData = await getQuizzes({ page: 1, limit: 5, searchTerm: "", userId: userId, quizTypes: [] })

  // Prepare data for collection page schema
  const collectionPageData = {
    name: "Explore Quizzes",
    description: "Discover a variety of interactive quizzes to test and enhance your programming knowledge and skills.",
    url: "/dashboard/quizzes",
  }

  // Prepare data for breadcrumb schema
  const breadcrumbData = [
    { name: "Home", url: "/" },
    { name: "Dashboard", url: "/dashboard" },
    { name: "Quizzes", url: "/dashboard/quizzes" },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <JsonLd type="default" />

      <h1 className="text-4xl font-bold mb-8 text-center text-primary">Explore Quizzes</h1>
      <Suspense fallback={<QuizzesSkeleton />}>
        <QuizzesClient initialQuizzesData={initialQuizzesData} userId={userId} />
      </Suspense>
    </div>
  )
}

export default QuizPage

