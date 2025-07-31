import { Suspense } from "react"
import type { Metadata } from "next"
import { getAuthSession } from "@/lib/auth"
import { getQuizzes, type QuizListItem } from "@/app/actions/getQuizes"

import { QuizzesClient } from "./components/QuizzesClient"
import ClientOnly from "@/components/ClientOnly"
import SuspenseGlobalFallback from "@/components/loaders/SuspenseGlobalFallback"
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper"
import { BookOpen, Sparkles, Zap, Target } from "lucide-react"
import { generateMetadata, JsonLD } from "@/lib/seo";

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
    "CourseAI quizzes"
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
          title={
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-4 bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-2xl text-primary-foreground shadow-lg">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce">
                  <Sparkles className="h-3 w-3 text-white m-0.5" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 bg-clip-text text-transparent">
                  Explore Quizzes
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">Interactive Learning</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-secondary/10 rounded-full border border-secondary/20">
                    <Target className="h-4 w-4 text-secondary-foreground" />
                    <span className="text-sm font-medium text-secondary-foreground">Skill Assessment</span>
                  </div>
                </div>
              </div>
            </div>
          }
          description="Discover a diverse collection of interactive quizzes designed to test your knowledge, enhance your skills, and accelerate your learning journey. From multiple choice questions to coding challenges, we've got something for every learner."
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

        <Suspense fallback={<SuspenseGlobalFallback message="Loading your amazing quizzes..." />}>
          <ClientOnly>
            <QuizzesClient initialQuizzesData={initialQuizzesData} userId={userId} />
          </ClientOnly>
        </Suspense>
      </div>
    </PageWrapper>
  )
}

export default Page
