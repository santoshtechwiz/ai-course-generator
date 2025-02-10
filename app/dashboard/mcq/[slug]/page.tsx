import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/authOptions"
import PlayQuiz from "../components/PlayQuiz"
import { QuizActions } from "../components/QuizActions"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedQuizHighlight } from "@/app/components/RanomQuiz"
import getMcqQuestions from "@/app/actions/getMcqQuestions"
import SectionWrapper from "@/components/SectionWrapper"

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params
  const { slug } = params

  const quiz = await prisma.userQuiz.findUnique({
    where: { slug },
    select: { id: true, topic: true, questions: true, user: { select: { name: true } } },
  })

  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000"

  if (!quiz) {
    return {
      title: "Quiz Not Found",
      description: "The requested quiz could not be found.",
    }
  }

  const title = `${quiz.topic} Quiz | YourQuizApp`
  const description = `Test your knowledge with this ${quiz.topic} quiz created by ${quiz.user.name}. Challenge yourself and learn something new!`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${websiteUrl}/quiz/${slug}`,
      type: "website",
      images: [
        {
          url: `${websiteUrl}/api/og?title=${encodeURIComponent(quiz.topic)}`,
          width: 1200,
          height: 630,
          alt: `${quiz.topic} Quiz Thumbnail`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${websiteUrl}/api/og?title=${encodeURIComponent(quiz.topic)}`],
    },
    alternates: {
      canonical: `${websiteUrl}/quiz/${slug}`,
    },
  }
}

export async function generateStaticParams() {
  const quizzes = await prisma.userQuiz.findMany({
    select: { slug: true },
  })

  return quizzes.filter((quiz) => quiz.slug).map((quiz) => ({ slug: quiz.slug }))
}

const QuizPage = async (props: { params: Promise<{ slug: string }> }) => {
  const params = await props.params
  const { slug } = params

  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id

  const result = await getMcqQuestions(slug);
  if (!result) {
    notFound()
  }

  

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
        <div className="p-6 space-y-4">
          {result?.result && (
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{result.result.topic} Quiz</h1>
          )}

        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              
              <Suspense fallback={<QuizSkeleton />}>
                {result.result && (
                  <SectionWrapper>
                  <QuizActions
                    quizId={result.result.id.toString()}
                    userId={currentUserId || ""}
                    ownerId={result.result.userId}
                    quizSlug={result.result.slug}
                    initialIsPublic={result.result.isPublic || false}
                    initialIsFavorite={result.result.isFavorite || false}
                    quizType="mcq"
                  />
                  </SectionWrapper>
                )}
                
                {result.result && 
                 <SectionWrapper>
                <PlayQuiz questions={result.questions} quizId={result.result.id} slug={slug} /> </SectionWrapper>}
              </Suspense>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6">

                <AnimatedQuizHighlight />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const QuizSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-8 w-1/2" />
    <Skeleton className="h-8 w-1/4" />
  </div>
)

export default QuizPage

