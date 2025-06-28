import { prisma } from "@/lib/db"
import { QuizType } from "@/types/quiz"

export default async function createQuestions(
  questions: any[],
  userQuizId: number,
  type: QuizType,
) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("No questions provided.")
  }

  const data = questions.map((question) => {
    switch (type) {
      case "mcq": {
        const q = question as any

        // Combine correct answer with distractors, then shuffle
        let allOptions = [q.option1, q.option2, q.option3, q.answer]
        // Remove duplicates
        allOptions = Array.from(new Set(allOptions))
        // Add "None of the above" if not already present
        if (allOptions.length < 3) {
          allOptions.push("None of the above")
        }
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
