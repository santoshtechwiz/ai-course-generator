"use server"
import prisma from "@/lib/db"

export interface ProcessedQuestion {
  id: string
  question: string
  answer: string
  options: string[]
}

export interface McqQuestionsResponse {

  id: string
  title: string
  slug: string
  isPublic: boolean
  isFavorite: boolean
  userId: string
  difficulty?: string

  questions: ProcessedQuestion[]
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
 * Generates metadata for the quiz page
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
        user: { select: { name: true } },
      },
    })

    const websiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    if (!quiz) {
      return {
        title: "Quiz Not Found",
        description: "The requested quiz could not be found.",
      }
    }

    const title = `${quiz.title} Quiz`
    const description = `Test your knowledge with this ${quiz.title} quiz${quiz.user?.name ? ` created by ${quiz.user.name}` : ""
      }. Challenge yourself and learn something new!`

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
            url: `${websiteUrl}/api/og?title=${encodeURIComponent(quiz.title)}`,
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
        images: [`${websiteUrl}/api/og?title=${encodeURIComponent(quiz.title)}`],
      },
      alternates: {
        canonical: `${websiteUrl}/quiz/${slug}`,
      },
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
    return {
      title: "Quiz",
      description: "Take this interactive quiz to test your knowledge.",
    }
  }
}
