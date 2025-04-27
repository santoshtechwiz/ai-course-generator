"use server"
import prisma from "@/lib/db"
import type { Metadata } from "next"

// Define clear interfaces for the database models
interface QuizQuestion {
  id: string
  question: string
  options: string // JSON string in the database
  answer: string
  correctAnswer?: string // Some questions might use this field instead
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
  options: string[] // For flexibility
}

// Define the response type
export interface McqQuestionsResponse {
  result: {
    id: string | number
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
export default async function getMcqQuestions(slug: string): Promise<McqQuestionsResponse> {
  console.log(`[getMcqQuestions] Fetching quiz data for slug: ${slug}`)

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

    console.log(`[getMcqQuestions] Found quiz: ${result.title} with ${result.questions.length} questions`)

    // Define a set of fallback options we can use if needed
    const fallbackOptions = [
      "True",
      "False",
      "All of the above",
      "None of the above",
      "It depends on the context",
      "This is not determinable from the information given",
      "Both A and B",
      "Neither A nor B",
      "Sometimes",
      "Always",
      "Never",
      "Rarely",
      "Often",
      "Possibly",
      "Definitely not",
    ]

    // Process and convert questions
    const questions: ProcessedQuestion[] = result.questions.map((question, index) => {
      // Use correctAnswer if available, otherwise fall back to answer
      const correctAnswer = question.answer || question.answer || ""

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
          parsedOptions = []
        }
      }

      // Create a Set to remove duplicates
      const uniqueOptions = new Set<string>()

      // Ensure the correct answer is included
      if (correctAnswer) {
        uniqueOptions.add(correctAnswer)
      }

      // Add other options if they're not duplicates
      parsedOptions.forEach((option) => {
        if (option && option !== correctAnswer) {
          uniqueOptions.add(option)
        }
      })

      // If we have fewer than 4 unique options, add fallbacks
      let fallbackIndex = 0
      while (uniqueOptions.size < 4 && fallbackIndex < fallbackOptions.length) {
        if (!uniqueOptions.has(fallbackOptions[fallbackIndex]) && fallbackOptions[fallbackIndex] !== correctAnswer) {
          uniqueOptions.add(fallbackOptions[fallbackIndex])
        }
        fallbackIndex++
      }

      // Convert back to array
      const finalOptions = Array.from(uniqueOptions)

      // Shuffle options with a stable seed based on question ID
      const seed = Number.parseInt(question.id) || index
      const shuffledOptions = [...finalOptions].sort(() => {
        const x = Math.sin(seed + 1) * 10000
        return x - Math.floor(x) - 0.5
      })

      // Extract individual options for backward compatibility
      const [option1 = "", option2 = "", option3 = ""] = shuffledOptions.filter((opt) => opt !== correctAnswer)

      // Log the processed question for debugging
      if (index === 0) {
        console.log(`[getMcqQuestions] First question processed:`, {
          id: question.id,
          question: question.question,
          correctAnswer,
          optionsCount: shuffledOptions.length,
        })
      }

      return {
        id: question.id,
        question: question.question || `Question ${index + 1}`,
        title: result.title, // Include the quiz title for context
        answer: correctAnswer,
        option1,
        option2,
        option3,
        options: shuffledOptions, // Include the full array for flexibility
      }
    })

    // Log the result for debugging
    console.log(`[getMcqQuestions] Successfully processed ${questions.length} questions`)

    return {
      result: {
        id: result.id,
        title: result.title,
        slug: result.slug,
        isPublic: result.isPublic,
        isFavorite: result.isFavorite,
        userId: result.userId,
        difficulty: result.difficulty || "medium", // Default to medium if not provided
      },
      questions,
    }
  } catch (error) {
    console.error("[getMcqQuestions] Error fetching MCQ questions:", error)
    throw new Error(`Failed to fetch quiz: ${error instanceof Error ? error.message : String(error)}`)
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
