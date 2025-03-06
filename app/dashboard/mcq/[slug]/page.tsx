import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo-utils"
import { getQuiz } from "@/app/actions/getQuiz"
import { QuizWrapper } from "@/components/QuizWrapper"
import RandomQuote from "@/components/RandomQuote"
import { BookOpen, Lightbulb } from "lucide-react"
import AnimatedQuizHighlight from "@/components/RanomQuiz"
import QuizSchema from "@/app/schema/quiz-schema"

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const quiz = await getQuiz(params.slug)

  if (!quiz) {
    return generatePageMetadata({
      title: "Quiz Not Found | CourseAI",
      description: "The requested quiz could not be found. Explore our other programming quizzes and assessments.",
      path: `/dashboard/mcq/${params.slug}`,
      noIndex: true,
    })
  }

  return generatePageMetadata({
    title: `${quiz.topic} | Multiple Choice Quiz`,
    description: `Test your knowledge on ${quiz.topic.toLowerCase()} with this interactive multiple-choice quiz. Enhance your programming skills through practice.`,
    path: `/dashboard/mcq/${params.slug}`,
    keywords: [
      `${quiz.topic.toLowerCase()} quiz`,
      "multiple choice questions",
      "programming assessment",
      "coding knowledge test",
      "developer skills evaluation",
    ],
    ogType: "article",
  })
}

const Page = async ({ params }: { params: { slug: string } }) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"
  const quiz = await getQuiz(params.slug)

  if (!quiz) {
    return null // This will be handled by Next.js to show the not-found page
  }

  // Breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Dashboard",
        item: `${baseUrl}/dashboard`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Multiple Choice Quizzes",
        item: `${baseUrl}/dashboard/mcq`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: quiz.topic,
        item: `${baseUrl}/dashboard/mcq/${params.slug}`,
      },
    ],
  }

  // Calculate estimated time based on question count
  const questionCount = quiz.questions?.length || 10
  const estimatedTime = `PT${Math.max(5, Math.ceil(questionCount * 1.5))}M` // 1.5 minutes per question, minimum 5 minutes

  return (
    <div className="container mx-auto py-6 space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <QuizSchema
        quiz={{
          topic: quiz.topic,
          description: `Test your knowledge on ${quiz.topic} with this interactive multiple-choice quiz.`,
          questionCount: questionCount,
          estimatedTime: estimatedTime,
          level:  "Intermediate",
          slug: params.slug,
        }}
      />
      <RandomQuote />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-background rounded-xl -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2" />
          <div className="relative bg-background/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-border/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold flex items-center text-foreground">
                <BookOpen className="mr-2 h-6 w-6 text-primary" />
                {quiz.topic}
              </h2>
              <div className="hidden sm:flex items-center text-sm text-muted-foreground bg-secondary/10 px-3 py-1.5 rounded-full">
                <Lightbulb className="h-4 w-4 mr-1.5 text-yellow-500" />
                Test your knowledge
              </div>
            </div>
            <QuizWrapper type="mcq"  />
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-secondary/5 to-background rounded-xl -m-1 transition-all duration-300 group-hover:scale-[1.01] group-hover:-m-2" />
          <div className="relative bg-background/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-border/50">
            <AnimatedQuizHighlight />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page

