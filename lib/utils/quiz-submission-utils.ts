import { QuizType, UserAnswer } from "@/app/types/quiz-types";

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
  answers,
  quizId,
  slug,
  type,
  timeTaken = 600
}: {
  answers: UserAnswer[],
  quizId?: string | number,
  slug: string,
  type: QuizType,
  timeTaken?: number
}) {
  // Normalize quizId
  const normalizedId = normalizeQuizId(quizId);
  
  // Count correct answers
  const correctAnswers = answers.filter(a => Boolean(a.isCorrect)).length;
  const totalQuestions = answers.length;
  
  // Calculate average time per question
  const timePerQuestion = Math.floor(timeTaken / Math.max(totalQuestions, 1));
  
  // Format answers according to API expectations
  const formattedAnswers = answers.map(answer => ({
    questionId: typeof answer.questionId === 'string' && /^\d+$/.test(answer.questionId) 
      ? parseInt(answer.questionId, 10) 
      : answer.questionId,
    answer: answer.answer,
    isCorrect: Boolean(answer.isCorrect),
    timeSpent: answer.timeSpent || timePerQuestion
  }));
  
  return {
    quizId: normalizedId,
    slug,
    type,
    answers: formattedAnswers,
    score: correctAnswers,
    totalQuestions,
    totalTime: timeTaken,
    correctAnswers
  };
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
