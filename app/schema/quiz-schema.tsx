import { generateQuizSchema } from "@/lib/seo-utils"

interface QuizSchemaProps {
  title: string
  description: string
  slug: string
  questionCount: number
  timeRequired: string
  educationalLevel?: string
}

export function QuizSchema({
  title,
  description,
  slug,
  questionCount,
  timeRequired,
  educationalLevel,
}: QuizSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"
  const quizUrl = `${baseUrl}/dashboard/quiz/${slug}`

  const quizSchema = generateQuizSchema({
    name: title,
    description,
    url: quizUrl,
    numberOfQuestions: questionCount,
    timeRequired,
    educationalLevel,
  })

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(quizSchema) }} />
}

