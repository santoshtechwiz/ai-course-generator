import type { UserAnswer } from '@/app/types/quiz-types';

/**
 * Prepares a submission payload for the API with all required fields
 */
export function prepareSubmissionPayload({
  slug,
  quizId,
  type,
  answers,
  timeTaken = 600
}: {
  slug: string;
  quizId?: string;
  type: 'code' | 'mcq' | 'openended' | 'blanks' | 'flashcard';
  answers: UserAnswer[];
  timeTaken?: number;
}) {
  // When quizId looks like a slug rather than a numeric ID,
  // prioritize using the slug field to avoid type confusion
  const isNumericId = quizId && !isNaN(Number(quizId));
  
  // Ensure answers include timeSpent property
  const formattedAnswers = answers.map(answer => ({
    questionId: answer.questionId,
    answer: answer.answer,
    timeSpent: Math.floor(timeTaken / Math.max(answers.length, 1)), // Distribute time evenly per question
  }));
  
  // Prepare complete submission payload that matches the server expectations
  return {
    slug: slug,                  // Always include slug for lookup
    quizId: isNumericId ? quizId : slug,  // For backward compatibility
    type,                        // Quiz type
    answers: formattedAnswers,
    timeTaken,                   // Use timeTaken field consistently
  };
}

/**
 * Validates submission before sending to server
 */
export function validateSubmission(payload: any): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  
  if (!payload.quizId && !payload.slug) errors.push('Either Quiz ID or slug is required');
  if (!payload.type) errors.push('Quiz type is required');
  
  if (!Array.isArray(payload.answers) || payload.answers.length === 0) {
    errors.push('Answers must be a non-empty array');
  }
  
  if (typeof payload.timeTaken !== 'number' || payload.timeTaken <= 0) {
    errors.push('Time taken must be a positive number');
  }
  
  return {
    valid: errors.length === 0,
    errors: errors.length ? errors : undefined
  };
}
