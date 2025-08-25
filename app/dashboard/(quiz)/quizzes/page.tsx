import { Suspense } from "react"
import type { Metadata } from "next"
import { getAuthSession } from "@/lib/auth"
import { getQuizzes, type QuizListItem } from "@/app/actions/getQuizes"


import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper"
import { JsonLD } from "@/lib/seo"
import { generateMetadata } from "@/lib/seo"
import QuizzesClientClient from "./components/QuizzesClientClient"

// Remove force-dynamic to allow static generation
// export const dynamic = "force-dynamic" // Disable caching for this page


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
    "flashcards",
    "multiple choice",
    "open ended questions",
    "quiz app",
    "online quiz platform",
    "quiz builder",
    "CourseAI quizzes",
  ],
})

// ...existing code...

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
    <PageWrapper>
      <div className="relative">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-0 w-64 h-64 bg-accent/5 rounded-full blur-2xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <PageHeader
          title="Explore Quizzes"
          description="Test your knowledge with interactive quizzes designed to boost your learning"
        />

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
            breadcrumb: {
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Dashboard",
                  item: "https://courseai.io/dashboard",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Quizzes",
                  item: "https://courseai.io/dashboard/quizzes",
                },
              ],
            },
            provider: {
              "@type": "Organization",
              name: "CourseAI",
              url: "https://courseai.io",
            },
          }}
        />

  <Suspense fallback={<div className="text-sm text-muted-foreground">Loading quizzes...</div>}>
          <QuizzesClientClient initialQuizzesData={initialQuizzesData} userId={userId} />
        </Suspense>
      </div>
    </PageWrapper>
  )
}

export default Page
