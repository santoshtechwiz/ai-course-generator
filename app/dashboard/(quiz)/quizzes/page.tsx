import { Suspense } from "react"
import type { Metadata } from "next"
import { getAuthSession } from "@/lib/auth"
import { getQuizzes, type QuizListItem } from "@/app/actions/getQuizes"
import ClientOnly from "@/components/ClientOnly"
import { SuspenseGlobalFallback } from "../../../../components/loaders"
import { JsonLD } from "@/lib/seo"
import { generateMetadata } from "@/lib/seo"
import { QuizzesClient } from "./components/QuizzesClient"

export const metadata: Metadata = generateMetadata({
  title: "Interactive Quizzes – Master Your Knowledge | CourseAI",
  description:
    "Discover our comprehensive collection of interactive quizzes including multiple choice, coding challenges, flashcards, and more. Test your knowledge and enhance your learning journey.",
  keywords: [
    "interactive quizzes",
    "knowledge testing",
    "learning assessment",
    "coding challenges",
    "educational quizzes",
    "skill evaluation",
    "practice tests",
    "learning platform",
    "quiz collection",
    "study tools",
  ],
})

export const dynamic = "force-dynamic"

const Page = async () => {
  const session = await getAuthSession()
  const userId = session?.user?.id
  const quizzesData = await getQuizzes({
    page: 1,
    limit: 12,
    searchTerm: "",
    userId: userId,
    quizTypes: [],
  })

  const initialQuizzesData = {
    quizzes: quizzesData.quizzes as QuizListItem[],
    nextCursor: quizzesData.nextCursor,
  }

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <JsonLD
        type="default"
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Interactive Quizzes",
          description:
            "Comprehensive collection of interactive educational quizzes including multiple choice, coding challenges, flashcards, and open-ended questions.",
          url: "https://courseai.io/dashboard/quizzes",
          mainEntity: {
            "@type": "ItemList",
            name: "Educational Quiz Collection",
            description: "Collection of interactive educational quizzes for skill development and knowledge testing",
            numberOfItems: quizzesData.quizzes.length,
          },
        }}
      />

      <ClientOnly>
        <Suspense fallback={<SuspenseGlobalFallback text="Loading quizzes…" />}>
          <QuizzesClient initialQuizzesData={initialQuizzesData} userId={userId} />
        </Suspense>
      </ClientOnly>
    </div>
  )
}

export default Page
