import { QuizJsonLd } from "@/app/schema/quiz-schema"


interface QuizDetails {
  type: string
  name: string
  description: string
  author: string
  datePublished: string
  numberOfQuestions: number
  timeRequired: string
  educationalLevel?: string
}

interface QuizStructuredDataProps {
  quizDetails: QuizDetails
}

export function QuizStructuredData({ quizDetails }: QuizStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://courseai.dev"

  return (
    <QuizJsonLd
      quizDetails={{
        name: quizDetails.name,
        description: quizDetails.description,
        url: `${baseUrl}/dashboard/quiz/${quizDetails.name.toLowerCase().replace(/\s+/g, "-")}`,
        numberOfQuestions: quizDetails.numberOfQuestions,
        timeRequired: quizDetails.timeRequired,
        educationalLevel: quizDetails.educationalLevel,
      }}
    />
  )
}

