import { Suspense } from "react"
import type { Metadata } from "next"
import { getAuthSession } from "@/lib/auth"
import { getQuizzes, type QuizListItem } from "@/app/actions/getQuizes"
import ClientOnly from "@/components/ClientOnly"
import { GlobalLoader } from "@/components/ui/loader"
import { generateMetadata, JsonLD } from "@/lib/seo"
import EnhancedQuizzesClient from "./components/QuizzesClient"

export const metadata: Metadata = generateMetadata({
  title: "Explore Interactive Quizzes – Master Your Knowledge | CourseAI",
  description:
    "Discover our comprehensive collection of interactive quizzes including multiple choice, coding challenges, flashcards, and more. Advanced filtering, search, and personalized recommendations to enhance your learning journey.",
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
    "personalized learning",
    "adaptive quizzes",
  ],
})

export const dynamic = "force-dynamic"

const Page = async () => {
  const session = await getAuthSession()
  const userId = session?.user?.id

  // Enhanced initial data fetching with better error handling
  let quizzesData
  try {
    quizzesData = await getQuizzes({
      page: 1,
      limit: 12,
      searchTerm: "",
      userId: userId,
      quizTypes: [],
    })
  } catch (error) {
    console.error("Failed to fetch initial quizzes:", error)
    quizzesData = { quizzes: [], nextCursor: null }
  }

  const initialQuizzesData = {
    quizzes: (quizzesData?.quizzes as QuizListItem[]) || [],
    nextCursor: quizzesData?.nextCursor || null,
  }

  return (
    <div className="min-h-screen bg-background">
      <JsonLD
        type="default"
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Interactive Quizzes",
          description:
            "Comprehensive collection of interactive educational quizzes including multiple choice, coding challenges, flashcards, and open-ended questions with advanced filtering and personalized recommendations.",
          url: "https://courseai.io/dashboard/quizzes",
          mainEntity: {
            "@type": "ItemList",
            name: "Educational Quiz Collection",
            description: "Collection of interactive educational quizzes for skill development and knowledge testing",
            numberOfItems: initialQuizzesData.quizzes.length,
            itemListElement: initialQuizzesData.quizzes.slice(0, 5).map((quiz, index) => ({
              "@type": "CreativeWork",
              name: quiz.title,
              description: (quiz as any).description || "",
              position: index + 1,
              educationalLevel: "Intermediate",
              timeRequired: `PT${Math.max(Math.ceil((quiz.questionCount || 10) * 0.5), 1)}M`,
            })),
          },
          potentialAction: {
            "@type": "SearchAction",
            target: "https://courseai.io/dashboard/quizzes?search={search_term}",
            "query-input": "required name=search_term",
          },
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" aria-labelledby="quizzes-heading">

        <section aria-live="polite" aria-busy="false">
          <ClientOnly>
            <Suspense fallback={<GlobalLoader message="Loading amazing quizzes…" />}>
              <div className="prose prose-invert max-w-none mb-6 sr-only" aria-hidden>
                {/* Keep SEO content available for screen readers if needed */}
                <h2>Interactive quizzes collection</h2>
                <p>
                  A comprehensive collection of educational quizzes including multiple choice, coding
                  challenges, flashcards, and open-ended questions with advanced filtering and
                  personalized recommendations.
                </p>
              </div>

              <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
                {/* Preserve existing client component — updated surrounding spacing and visual hierarchy */}
                <EnhancedQuizzesClient initialQuizzesData={initialQuizzesData} userId={userId} />
              </div>
            </Suspense>
          </ClientOnly>
        </section>
      </main>
    </div>
  )
}

export default Page
