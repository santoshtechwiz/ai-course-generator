import { Suspense } from "react"
import type { Metadata } from "next"
import { getAuthSession } from "@/lib/auth"
import { motion } from "framer-motion"

import { getQuizzes, QuizListItem } from "@/app/actions/getQuizes"
import { JsonLD, generateMetadata } from "@/lib/seo-manager-new"
// Import components directly to avoid any issues with the barrel file
import { QuizzesClient } from "./components/QuizzesClient"
import { QuizzesSkeleton } from "./components/QuizzesSkeleton"
import QuizDashboardWrapper from "./components/QuizDashboardWrapper"
import TestComponent from "./components/TestComponent"
import { Loader } from "@/components/ui/loader"
import ClientOnly from "@/components/ClientOnly"
import { AnimatedIntro } from "./components/AnimatedIntro"


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
    <QuizDashboardWrapper>
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

          <AnimatedIntro />
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
    </QuizDashboardWrapper>
  )
}

export default QuizPage
