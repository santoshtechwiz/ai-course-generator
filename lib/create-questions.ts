import { prisma } from "@/lib/db"
import { QuizType } from "@/types/quiz"

export default async function createQuestions(
  questions: any[], // we’ll validate inside
  userQuizId: number,
  type: QuizType, // "mcq" | "code" | "openended"
) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("No questions provided.")
  }

  const data = questions.map((question) => {
    switch (type) {
      case "mcq": {
        const q = question as any

        // Combine correct answer with distractors, then shuffle
        const allOptions = [q.option1,q.option2,q.option3, q.answer]
        const shuffledOptions = allOptions.sort(() => Math.random() - 0.5)

        return {
          question: q.question,
          answer: q.answer,
          options: JSON.stringify(shuffledOptions),
          userQuizId,
          questionType: "mcq" as const,
        }
      }

      case "code": {
        const q = question as any

        return {
          question: q.question,
          answer: q.correctAnswer,
          options: JSON.stringify(q.options || []),
          codeSnippet: q.codeSnippet ?? null,
          userQuizId,
          questionType: "code" as const,
        }
      }

      case "openended": {
        const q = question as any
        return {
          question: q.question,
          answer: q.answer,
          userQuizId,
          questionType: "openended" as const,
        }
      }

      default:
        throw new Error(`Unsupported question type: ${type}`)
    }
  })

  await prisma.userQuizQuestion.createMany({ data })
}
