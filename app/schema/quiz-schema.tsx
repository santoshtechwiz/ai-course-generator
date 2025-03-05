import { generateQuizSchema, QuizSchemaParams } from "@/components/json-ld"

interface QuizJsonLdProps {
  quizDetails: QuizSchemaParams
}

export function QuizJsonLd({ quizDetails }: QuizJsonLdProps) {
  const quizSchema = generateQuizSchema(quizDetails)

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(quizSchema) }} />
}

