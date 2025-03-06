"use client"

import { generateQuizSchema } from "@/components/json-ld"

interface QuizSchemaProps {
  quiz: {
    topic: string
    description?: string
    questionCount: number
    estimatedTime?: string
    level?: string
    slug: string
  }
}

export default function QuizSchema({ quiz }: QuizSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"
  const quizUrl = `${baseUrl}/dashboard/mcq/${quiz.slug}`

  const quizSchema = generateQuizSchema({
    name: `${quiz.topic} Quiz`,
    description: quiz.description || `Test your knowledge on ${quiz.topic} with this interactive quiz.`,
    url: quizUrl,
    numberOfQuestions: quiz.questionCount,
    timeRequired: quiz.estimatedTime || "PT10M", // Default 10 minutes in ISO 8601 duration format
    educationalLevel: quiz.level,
  })

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(quizSchema) }} />
}

