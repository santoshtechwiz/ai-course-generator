import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { generateQuizMetadata } from "@/lib/quiz-metadata"
import McqQuizClient from "./components/McqQuizClient"

/**
 * MCQ Quiz Instance Page (Server Component)
 * 
 * Provides proper SEO metadata for individual quiz instances
 * while delegating the interactive functionality to a client component
 */

type McqQuizPageProps = {
  params: Promise<{ slug: string }>
}

// Server-side data fetching function
async function getQuizData(slug: string) {
  try {
    // In a real implementation, you would fetch from your API or database
    // For now, we'll return mock data that matches the expected structure
    return {
      id: slug,
      title: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: `Test your knowledge with this ${slug.replace(/-/g, ' ')} quiz`,
      questionCount: 10,
      difficulty: "medium" as const,
      category: "General Knowledge",
      questions: [] // Will be loaded client-side for interactivity
    }
  } catch (error) {
    console.error('Failed to fetch quiz data:', error)
    return null
  }
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ 
  params 
}: McqQuizPageProps): Promise<Metadata> {
  const { slug } = await params
  const quizData = await getQuizData(slug)
  
  if (!quizData) {
    return generateQuizMetadata({
      quizType: "mcq",
      title: "Quiz Not Found",
      description: "The requested quiz could not be found."
    })
  }
  
  return generateQuizMetadata({
    quizType: "mcq",
    title: quizData.title,
    description: quizData.description,
    topic: quizData.category,
    difficulty: quizData.difficulty,
    questionCount: quizData.questionCount
  })
}

export default async function McqQuizPage({ params }: McqQuizPageProps) {
  const { slug } = await params
  const quizData = await getQuizData(slug)
  
  if (!quizData) {
    notFound()
  }
  
  // Pass the quiz data to the client component for interactivity
  return <McqQuizClient slug={slug} initialQuizData={quizData} />
}
