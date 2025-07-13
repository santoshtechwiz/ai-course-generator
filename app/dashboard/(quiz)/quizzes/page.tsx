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


import ClientOnly from "@/components/ClientOnly"
import { AnimatedIntro } from "./components/AnimatedIntro"
import { GlobalLoader } from "@/components/ui/loader"
import SuspenseGlobalFallback from "@/components/loaders/SuspenseGlobalFallback"


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

const Page = async () => {
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
      {/* Main container with the gradient background */}
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-950 dark:to-gray-900 py-8">
        {" "}
        {/* Added py-8 here */}
        <div className="container mx-auto px-4 max-w-7xl">
          {" "}
          {/* Removed py-8 from here */}
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
          {/* Ensure AnimatedIntro content is centered and has bottom margin */}
          <div className="text-center mb-8">
            {" "}
            {/* Added text-center and mb-8 */}
            <AnimatedIntro />
          </div>
          <Suspense fallback={<SuspenseGlobalFallback message="Loading Courses..." />}>
           
            <ClientOnly>
              <QuizzesClient initialQuizzesData={initialQuizzesData} userId={userId} />
            </ClientOnly>
          </Suspense>
        </div>
      </div>
    </QuizDashboardWrapper>
  )
}

export default Page