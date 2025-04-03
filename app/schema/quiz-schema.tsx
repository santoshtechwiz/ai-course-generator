import type React from "react"

interface QuizSchemaProps {
  quiz: {
    title: string
    description: string
    url: string
    questionCount: number
    timeRequired?: string // ISO 8601 duration format (e.g., "PT30M" for 30 minutes)
    educationalLevel?: string
    author?: {
      name: string
      url: string
    }
  }
}

const QuizSchema: React.FC<QuizSchemaProps> = ({ quiz }) => {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: quiz.title,
    description: quiz.description,
    url: quiz.url,
    numberOfQuestions: quiz.questionCount,
    provider: {
      "@type": "Organization",
      name: "CourseAI",
      sameAs: process.env.NEXT_PUBLIC_SITE_URL,
    },
    ...(quiz.timeRequired && { timeRequired: quiz.timeRequired }),
    ...(quiz.educationalLevel && { educationalLevel: quiz.educationalLevel }),
    ...(quiz.author && {
      author: {
        "@type": "Person",
        name: quiz.author.name,
        url: quiz.author.url,
      },
    }),
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />
}

export default QuizSchema

