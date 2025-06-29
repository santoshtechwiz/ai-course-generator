"use server"
import prisma from "@/lib/db"
// Add proper import for Metadata type
import type { Metadata } from "next"
import type { ProcessedQuestion } from "@/app/types/quiz-types"

export interface McqQuestionsResponse {
  id: string
  title: string
  slug: string
  isPublic: boolean
  isFavorite: boolean
  userId: string
  difficulty?: string
  questions: ProcessedQuestion[]
  result?: any
}

export default async function getMcqQuestions(slug: string): Promise<McqQuestionsResponse> {
  try {
    const result = await prisma.userQuiz.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        isPublic: true,
        isFavorite: true,
        userId: true,
        difficulty: true,
        questions: {
          select: {
            id: true,
            question: true,
            options: true,
            answer: true,
          },
        },
      },
    })

    if (!result) return { result: null, questions: [] }

    const questions = result.questions.map((q) => {
      const options = JSON.parse(q.options || "[]")
      if (!options.includes(q.answer)) options.push(q.answer)
      return {
        id: String(q.id),
        question: q.question,
        answer: q.answer,
        options: options.sort(() => Math.random() - 0.5),
      }
    })

    return {
      id: String(result.id),
      title: result.title,
      slug: result.slug,
      isPublic: result.isPublic,
      isFavorite: result.isFavorite,
      userId: result.userId,
      difficulty: result.difficulty || "medium",

      questions,
    }
  } catch (error) {
    console.error("[getMcqQuestions] Error:", error)
    throw new Error("Failed to fetch quiz data.")
  }
}

/**
 * Generates metadata for the quiz page with improved SEO
 */
export async function generateMetadata(props: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = props.params

  try {
    const quiz = await prisma.userQuiz.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        questions: true,
        quizType: true,
        user: { select: { name: true } },
      },
    })

    const websiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    if (!quiz) {
      return {
        title: "Quiz Not Found",
        description: "The requested quiz could not be found.",
        robots: { index: false, follow: false },
      }
    }

    const quizTypeLabel = getQuizTypeLabel(quiz.quizType)
    const questionCount = quiz.questions?.length || 0

    const title = `${quiz.title} ${quizTypeLabel} Quiz`
    const description = `Test your knowledge with this ${quiz.title} ${quizTypeLabel} quiz${
      quiz.user?.name ? ` created by ${quiz.user.name}` : ""
    }. Challenge yourself with ${questionCount} questions and learn something new!`

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
            url: `${websiteUrl}/api/og?title=${encodeURIComponent(quiz.title)}&type=${quiz.quizType}`,
            width: 1200,
            height: 630,
            alt: `${quiz.title} Quiz Thumbnail`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [`${websiteUrl}/api/og?title=${encodeURIComponent(quiz.title)}&type=${quiz.quizType}`],
      },
      alternates: {
        canonical: `${websiteUrl}/quiz/${slug}`,
      },
      keywords: [quiz.title, quizTypeLabel, "quiz", "learning", "education", "test", "assessment"],
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "Quiz",
      description: "Take this interactive quiz to test your knowledge.",
    }
  }
}

// Helper function to get a user-friendly quiz type label
function getQuizTypeLabel(quizType?: string): string {
  switch (quizType) {
    case "mcq":
      return "Multiple Choice"
    case "openended":
      return "Open-Ended"
    case "blanks":
      return "Fill-in-the-Blanks"
    case "code":
      return "Coding"
    case "flashcard":
      return "Flashcard"
    default:
      return ""
  }
}
