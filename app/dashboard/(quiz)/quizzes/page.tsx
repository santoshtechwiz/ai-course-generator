import { Suspense } from "react"
import type { Metadata } from "next"
import { getAuthSession } from "@/lib/auth"

import { getQuizzes, QuizListItem } from "@/app/actions/getQuizes"
import { JsonLD } from "@/app/schema/components"
import { generateMetadata } from "@/lib/seo"
import { QuizzesClient } from "./components/QuizzesClient"
import { QuizzesSkeleton } from "./components/QuizzesSkeleton"
import { Loader } from "@/components/ui/loader"
import ClientOnly from "@/components/ClientOnly"


export const metadata: Metadata = generateMetadata({
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <JsonLD
          type="default"
          data={{
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Explore Quizzes",
            description: "Discover interactive quizzes to test and enhance your programming knowledge and skills.",
            url: "https://courseai.io/dashboard/quizzes",
          }}
        />

        <h1 className="text-4xl font-bold mb-2 text-center text-primary text-gray-900 dark:text-gray-100">
          Explore Quizzes
        </h1>
        <p className="text-center text-muted-foreground mb-8 max-w-2xl mx-auto text-gray-600 dark:text-gray-400">
          Discover interactive quizzes to test and enhance your programming knowledge and skills. Create your own
          quizzes to share with the community.
        </p>

        <Suspense
          fallback={
            <div className="space-y-4">
              <Loader variant="skeleton"/>
              <QuizzesSkeleton />
            </div>
          }
        >
          <ClientOnly>
            <QuizzesClient initialQuizzesData={initialQuizzesData} userId={userId} />
          </ClientOnly>
        </Suspense>
      </div>
    </div>
  )
}

export default QuizPage
