import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"
import { prisma } from "@/lib/db"
import { authOptions } from "@/lib/authOptions"


import getMcqQuestions from "@/app/actions/getMcqQuestions"
import McqQuizWrapper from "@/components/features/mcq/McqQuizWrapper"
import { QuizSkeleton } from "@/components/features/mcq/QuizSkeleton"
import AnimatedQuizHighlight from "@/components/RanomQuiz"
import QuizHeader from "@/components/shared/QuizHeader"
import { QuizStructuredData } from "@/components/withQuizStructuredData"



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

  const title = `${quiz.topic} Quiz `
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

const McqPage = async (props: { params: Promise<{ slug: string }> }) => {
  const params = await props.params
  const { slug } = params

  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id

  const result = await getMcqQuestions(slug);
  if (!result) {
    notFound()
  }
  if (!result.result) {
    notFound()
  }

  const quizDetails = {
    type: "mcq",
    name: result.result.topic,
    description: `Test your knowledge with this ${result.result.topic} quiz.`,
    author: "Course AI",
    datePublished: new Date().toISOString(),
    numberOfQuestions: result.questions.length || 0,
    timeRequired: 'PT30M', // Assuming 30 minutes, adjust as needed
    educationalLevel: 'Beginner', // Adjust as needed
  };

 
  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <QuizStructuredData quizDetails={quizDetails} />
      {result?.result && (
        <QuizHeader topic={result.result.topic} />
      )}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 ">
          <Suspense fallback={<QuizSkeleton />}>
            <McqQuizWrapper slug={slug} currentUserId={currentUserId || ""} result={result} />
          </Suspense>
        </div>
        <div className="lg:col-span-1">
          <AnimatedQuizHighlight />
        </div>
      </div>
    </div>
  )
}

export default McqPage
