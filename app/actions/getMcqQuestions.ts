"use server"
import prisma from "@/lib/db"
import type { Metadata } from "next"

// Define clear interfaces for the database models
interface QuizQuestion {
  id: string
  question: string
  options: string // JSON string in the database
  answer: string
}

interface QuizUser {
  id: string
  name?: string
}

interface DatabaseQuiz {
  id: string
  title: string
  slug: string
  isPublic: boolean
  isFavorite: boolean
  userId: string
  questions: QuizQuestion[]
  user: QuizUser
  difficulty?: string
}

// Define the processed question format
export interface ProcessedQuestion {
  id: string
  question: string
  title?: string
  answer: string
  option1: string
  option2: string
  option3: string
  options?: string[] // For flexibility
}

// Define the response type
export interface McqQuestionsResponse {
  result: {
    id: string
    title: string
    slug: string
    isPublic: boolean
    isFavorite: boolean
    userId: string
    difficulty?: string
  } | null
  questions: ProcessedQuestion[]
}

/**
 * Fetches MCQ questions for a specific quiz by slug
 * @param slug The unique slug identifier for the quiz
 * @returns The quiz data and processed questions
 */
const getMcqQuestions = async (slug: string): Promise<McqQuestionsResponse> => {
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
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Handle case where no result is found
    if (!result) {
      console.log(`No quiz found with slug: ${slug}`)
      return { result: null, questions: [] }
    }

    // Process and convert questions
    const questions: ProcessedQuestion[] = result.questions.map((question) => {
      // Parse options with error handling
      let parsedOptions: string[] = []

      if (question.options) {
        try {
          parsedOptions = JSON.parse(question.options)
          // Ensure we have an array
          if (!Array.isArray(parsedOptions)) {
            console.warn(`Options for question ${question.id} is not an array, converting...`)
            parsedOptions = [String(parsedOptions)]
          }
        } catch (error) {
          console.error(`Error parsing options for question ${question.id}:`, error)
          // Create fallback options that include the answer
          parsedOptions = [question.answer, "Option 1", "Option 2", "Option 3"].filter(
            (opt, index, self) =>
              // Remove duplicates and ensure answer is included
              opt && self.indexOf(opt) === index,
          )
        }
      }

      // Ensure we have at least the answer in the options
      if (!parsedOptions.includes(question.answer) && question.answer) {
        parsedOptions.unshift(question.answer)
      }

      // Extract individual options for backward compatibility
      const [option1 = "", option2 = "", option3 = ""] = parsedOptions

      return {
        id: question.id,
        question: question.question,
        title: result.title, // Include the quiz title for context
        answer: question.answer,
        option1,
        option2,
        option3,
        options: parsedOptions, // Include the full array for flexibility
      }
    })

    return {
      result: {
        id: Number(result.id),
        title: result.title,
        slug: result.slug,
        isPublic: result.isPublic,
        isFavorite: result.isFavorite,
        userId: result.userId,
        difficulty: result.difficulty|| "medium", // Default to medium if not provided
      },
      questions,
    }
  } catch (error) {
    console.error("Error fetching MCQ questions:", error)
    return { result: null, questions: [] }
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
    const description = `Test your knowledge with this ${quiz.title} quiz${
      quiz.user?.name ? ` created by ${quiz.user.name}` : ""
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

export default getMcqQuestions
