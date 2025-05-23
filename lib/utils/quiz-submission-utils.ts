import { QuizType } from "@/types/quiz"

/**
 * Ensures that quiz IDs are properly formatted as numbers when needed
 */
export function normalizeQuizId(id: string | number | undefined): number | string | undefined {
  if (id === undefined) return undefined;
  
  if (typeof id === 'number') return id;
  
  if (typeof id === 'string') {
    // If it's a numeric string, convert to number
    if (/^\d+$/.test(id)) {
      return parseInt(id, 10);
    }
    // Otherwise keep it as a string
    return id;
  }
  
  // Fallback
  return id;
}

/**
 * Prepares a standardized submission payload for any quiz type
 */
export function prepareSubmissionPayload({
  answers = [],
  quizId,
  slug,
  type,
  timeTaken
}: {
  answers: any[],
  quizId?: string | number,
  slug: string,
  type: QuizType,
  timeTaken?: number
}) {
  // Use provided timeTaken or calculate from answers
  const totalTime = timeTaken || answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0)

  // Format answers consistently
  const formattedAnswers = answers.map(a => {
    const base = {
      questionId: String(a.questionId || ""),
      answer: a.answer || a.selectedOption || "",
      timeSpent: a.timeSpent || Math.round(totalTime / answers.length),
      isCorrect: a.isCorrect === undefined ? false : Boolean(a.isCorrect)
    }
    // Remove undefined/null values
    return Object.fromEntries(
      Object.entries(base).filter(([_, v]) => v !== undefined && v !== null)
    )
  })

  // Calculate score and correctAnswers
  const correctCount = formattedAnswers.filter(a => a.isCorrect === true).length

  return {
    quizId: quizId ? String(quizId) : undefined,
    slug,
    type,
    answers: formattedAnswers,
    score: correctCount,
    totalQuestions: answers.length,
    totalTime: totalTime || 600, // Default to 600 if no time provided
    correctAnswers: correctCount
  }
}

/**
 * Validates that a quiz ID is properly formatted
 */
export function isValidQuizId(id: any): boolean {
  if (id === undefined || id === null) return false;
  
  if (typeof id === 'number') return true;
  
  if (typeof id === 'string') {
    return /^\d+$/.test(id);
  }
  
  return false;
}

/**
 * Validates the quiz submission payload
 */
export function validateQuizSubmission(payload: any) {
  if (!payload) {
    return { 
      isValid: false,
      errors: ["Missing required fields"],
      error: "Missing required fields: quizId, slug, type, answers"
    }
  }

  const errors: string[] = []
  const requiredFields = ["slug", "type"]
  const missingFields = requiredFields.filter(field => !payload[field])

  if (missingFields.length > 0) {
    errors.push("Missing required fields")
  }

  if (!Array.isArray(payload.answers)) {
    errors.push("Invalid answers format")
  }

  // For valid payloads, return just isValid: true
  if (errors.length === 0) {
    return { isValid: true }
  }

  // For invalid payloads, include error details
  return {
    isValid: false,
    errors,
    error: missingFields.length > 0 
      ? `Missing required fields: ${missingFields.join(", ")}`
      : errors[0]
  }
}
