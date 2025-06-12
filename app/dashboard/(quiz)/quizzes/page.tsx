import { Suspense } from "react"
import type { Metadata } from "next"
import { getAuthSession } from "@/lib/auth"

import { getQuizzes } from "@/app/actions/getQuizes"
import { JsonLd } from "@/app/schema/components/json-ld"
import { generatePageMetadata } from "@/lib/seo-utils"
import { QuizzesClient } from "./components/QuizzesClient"
import { QuizzesSkeleton } from "./components/QuizzesSkeleton"
import { Loader } from "@/components/ui/loader"
import ClientOnly from "@/components/ClientOnly"
import type { QuizListItem } from "@/app/types/types"

export const metadata: Metadata = generatePageMetadata({
  title: "Free Quizzes – MCQs, Open-ended and Code Challenges",
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
  const quizzesData = await getQuizzes({ page: 1, limit: 5, searchTerm: "", userId: userId, quizTypes: [] })

  // Transform the data to match the expected interface
  const initialQuizzesData = {
    quizzes: quizzesData.quizzes as QuizListItem[],
    nextCursor: quizzesData.nextCursor,
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <JsonLd type="default" data={undefined} />

      <h1 className="text-4xl font-bold mb-2 text-center text-primary">Explore Quizzes</h1>
      <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto">
        Discover interactive quizzes to test and enhance your programming knowledge and skills. Create your own quizzes
        to share with the community.
      </p>

      <Suspense
        fallback={
          <div className="space-y-4">
            <Loader variant="skeleton" text="Loading quizzes..." />
            <QuizzesSkeleton />
          </div>
        }
      >
        <ClientOnly>
          <QuizzesClient initialQuizzesData={initialQuizzesData} userId={userId} />
        </ClientOnly>
      </Suspense>
    </div>
  )
}

export default QuizPage
