import { Suspense } from "react"
import type { Metadata } from "next"
import { getAuthSession } from "@/lib/auth"
import { getQuizzes, type QuizListItem } from "@/app/actions/getQuizes"
import { JsonLD, generateMetadata } from "@/lib/seo-manager-new"
import { QuizzesClient } from "./components/QuizzesClient"
import ClientOnly from "@/components/ClientOnly"
import SuspenseGlobalFallback from "@/components/loaders/SuspenseGlobalFallback"
import { PageHeader, PageWrapper } from "@/components/layout/PageWrapper"
import { BookOpen, Sparkles } from "lucide-react"

export const metadata: Metadata = generateMetadata({
  title: "Interactive Quizzes – Test Your Knowledge",
  description:
    "Explore our comprehensive collection of interactive quizzes including multiple choice, coding challenges, and more to enhance your learning experience.",
  path: "/dashboard/quizzes",
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
  ogType: "website",
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
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <PageHeader
          title={
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-primary to-primary/80 rounded-xl text-primary-foreground">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Explore Quizzes</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    Interactive learning experiences tailored for you
                  </span>
                </div>
              </div>
            </div>
          }
          description="Discover a diverse collection of quizzes designed to test your knowledge, enhance your skills, and accelerate your learning journey across various topics and difficulty levels."
        />

        <JsonLD
          type="default"
          data={{
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Interactive Quizzes",
            description:
              "Explore comprehensive collection of interactive quizzes to test knowledge and enhance learning experience.",
            url: "https://courseai.io/dashboard/quizzes",
            mainEntity: {
              "@type": "ItemList",
              name: "Quiz Collection",
              description: "Collection of interactive educational quizzes",
            },
          }}
        />

        <Suspense fallback={<SuspenseGlobalFallback message="Loading your quizzes..." />}>
          <ClientOnly>
            <QuizzesClient initialQuizzesData={initialQuizzesData} userId={userId} />
          </ClientOnly>
        </Suspense>
      </div>
    </PageWrapper>
  )
}

export default Page
