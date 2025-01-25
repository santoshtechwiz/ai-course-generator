import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/authOptions"
import CourseCreationVideo from "@/app/components/landing/CourseCreationVideo"
import PlayQuiz from "../components/PlayQuiz"
import { QuizActions } from "../components/QuizActions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Question } from "@/app/types"



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

  const result = await prisma.userQuiz.findUnique({
    where: { slug },
    select: {
      id: true,
      topic: true,
      slug: true,
      isPublic: true,
      isFavorite: true,
      userId: true,
      questions: {
        select: {
          id: true,
          question: true,
          options: true,
          answer: true,
        },
      },
      user: {
        select: {
          id: true,
        },
      },
    },
  })

  if (!result) {
    notFound()
  }

  const questions: Question[] = result.questions.map((question) => {
    let options: string[] = []
    if (question.options) {
      try {
        options = JSON.parse(question.options)
      } catch (error) {
        console.error("Error parsing options:", error)
        options = ["Option 1", "Option 2", "Option 3"] // Default fallback
      }
    }
    const [option1, option2, option3] = options

    return {
      id: question.id,
      question: question.question,
      answer: question.answer,
      option1: option1 || "",
      option2: option2 || "",
      option3: option3 || "",
    }
  })

 
  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{result.topic} Quiz</CardTitle>
         
            <QuizActions
              quizId={result.id.toString()}
              userId={currentUserId || ""}
              ownerId={result.user.id}
              quizSlug={result.slug}
              initialIsPublic={result.isPublic || false}
              initialIsFavorite={result.isFavorite || false}
            />
         
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Suspense fallback={<QuizSkeleton />}>
                <PlayQuiz questions={questions} quizId={result.id} slug={slug}/>
              </Suspense>
            </div>
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Course Creation</CardTitle>
                </CardHeader>
                <CardContent>
                  <CourseCreationVideo />
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
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

