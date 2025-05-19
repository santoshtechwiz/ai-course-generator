import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import type { Metadata } from "next"
import { authOptions } from "@/lib/auth"
import { generatePageMetadata } from "@/lib/seo-utils"
import { getQuiz } from "@/app/actions/getQuiz"
import type { OpenEndedQuizData } from "@/types/quiz"
import { ClientWrapper } from "./ClientWrapper"

interface PageProps {
  params: Promise<{ slug: string }> | { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = 'slug' in params ? params.slug : (await params).slug
  const quizData = await getQuiz<OpenEndedQuizData>(slug)

  if (!quizData) {
    return generatePageMetadata({
      title: "Open-Ended Quiz Not Found | CourseAI",
      description: "The requested programming quiz could not be found.",
      path: `/dashboard/openended/${slug}`,
      noIndex: true,
    })
  }

  return generatePageMetadata({
    title: `${quizData.title} | Open-Ended Programming Quiz`,
    description: `Develop your programming problem-solving skills with this ${quizData.title?.toLowerCase()} open-ended coding quiz. Enhance critical thinking.`,
    path: `/dashboard/openended/${slug}`,
    keywords: [
      "open-ended coding questions",
      "programming problem solving",
      "coding critical thinking",
      `${quizData.title?.toLowerCase()} practice`,
      "developer reasoning skills",
    ],
    ogType: "article",
  })
}

export default async function OpenEndedQuizPage({ params }: PageProps) {
  const slug = 'slug' in params ? params.slug : (await params).slug
  const session = await getServerSession(authOptions)
  const currentUserId = session?.user?.id
  const quizData = await getQuiz<OpenEndedQuizData>(slug)

  if (!quizData) {
    notFound()
  }

  // Create breadcrumb items
  const breadcrumbItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Open-ended", href: "/dashboard/openended" },
    { name: quizData.title || "Quiz", href: `/dashboard/openended/${slug}` },
  ]

  // Add ClientWrapper with reset handling
  return (
    <div className="container mx-auto px-4 py-8">
      <ClientWrapper slug={slug} quizData={quizData} />
    </div>
  )
}
