import { QuizType } from "@/types/quiz"

export function normalizeQuizId(id: string | number | undefined): number | string | undefined {
  if (id === undefined) return undefined
  if (typeof id === "number") return id
  if (/^\d+$/.test(id)) return parseInt(id, 10)
  return id
}

interface QuizMeta {
  id: string | number
  slug: string
  type: QuizType
}

interface UserAnswer {
  questionId: string
  answer: string
  isCorrect?: boolean
  timeSpent?: number
}

/**
 * Prepares a standardized submission payload for any quiz type.
 */
export function prepareSubmissionPayload(
  quiz: QuizMeta,
  userAnswers: UserAnswer[],
  timeTaken?: number
) {
  const totalTime = timeTaken ?? userAnswers.reduce((sum, a) => sum + (a.timeSpent || 0), 0)

  const formattedAnswers = userAnswers.map((a) => ({
    questionId: String(a.questionId ?? ""),
    answer: a.answer ?? "",
    timeSpent: a.timeSpent ?? Math.floor(totalTime / userAnswers.length),
    isCorrect: a.isCorrect ?? false,
  }))

  const correctCount = formattedAnswers.filter((a) => a.isCorrect === true).length

  return {
    quizId: normalizeQuizId(quiz.id),
    slug: quiz.slug,
    type: quiz.type,
    answers: formattedAnswers,
    score: correctCount,
    totalQuestions: formattedAnswers.length,
    totalTime: totalTime || 600,
    correctAnswers: correctCount,
  }
}

/**
 * Validates a submission payload structure
 */
export function validateQuizSubmission(payload: any) {
  if (!payload) {
    return {
      isValid: false,
      errors: ["Missing required fields"],
      error: "Missing required fields",
    }
  }

  const requiredFields = [
    "slug",
    "type",
    "answers",
    "score",
    "totalTime",
    "totalQuestions",
    "correctAnswers",
  ]

  const errors: string[] = []

  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null) {
      errors.push(`Missing required field: ${field}`)
    }
  }

  if (!Array.isArray(payload.answers)) {
    errors.push("Answers must be an array")
  } else if (payload.answers.length === 0) {
    errors.push("No answers provided")
  } else {
    for (const ans of payload.answers) {
      if (!ans.questionId || ans.answer == null || ans.timeSpent == null) {
        errors.push("Invalid answer format")
        break
      }
    }
  }

  return errors.length === 0
    ? { isValid: true }
    : {
        isValid: false,
        errors,
        error: errors[0],
      }
}
