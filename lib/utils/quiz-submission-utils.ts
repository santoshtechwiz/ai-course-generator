import { UserAnswer, QuizType } from "@/app/types/quiz-types";
import { BlanksQuizAnswer, CodeQuizAnswer, QuizAnswer } from "@/app/api/quizzes/common/[slug]/complete/route";

interface SubmissionParams {
  slug: string;
  quizId?: string;
  type: QuizType;
  answers: UserAnswer[];
  timeTaken?: number;
  score?: number;
  totalQuestions?: number;
}

interface SubmissionPayload {
  quizId: string;
  answers: any[]; // Using any[] instead of QuizAnswerUnion for flexibility
  type: QuizType;
  score: number;
  totalTime: number;
  totalQuestions?: number;
  correctAnswers?: number;
}

/**
 * Prepares a quiz submission payload from user answers and quiz data
 * @param quiz Quiz data including id, slug, and type
 * @param userAnswers Array of user answers with question IDs
 * @param totalTime Total time spent on the quiz in seconds
 * @returns A formatted submission payload ready to be sent to the API
 */
export function prepareSubmissionPayload(quiz, userAnswers, totalTime) {
  // Count correct answers for score calculation
  const correctAnswers = userAnswers.filter(answer => 
    answer.isCorrect === true
  ).length;
  
  return {
    quizId: quiz.id || "",
    slug: quiz.slug || "",
    type: quiz.type || "mcq",
    answers: userAnswers.map(a => ({
      questionId: a.questionId,
      answer: a.answer,
      isCorrect: typeof a.isCorrect === 'boolean' ? a.isCorrect : false,
      timeSpent: a.timeSpent || 0
    })),
    score: correctAnswers,
    totalTime: totalTime || 0,
    totalQuestions: userAnswers.length,
    correctAnswers: correctAnswers
  };
}

/**
 * Validates a quiz submission payload to ensure it has all required fields
 * @param payload The quiz submission payload to validate
 * @returns Object with isValid flag and optional errors array
 */
export function validateQuizSubmission(payload) {
  const errors = [];
  
  // Check required top-level fields
  if (!payload.quizId || !payload.type || 
      typeof payload.score === 'undefined' || 
      typeof payload.totalTime === 'undefined') {
    errors.push('Missing required fields');
  }
  
  // Check answers array
  if (!payload.answers || !Array.isArray(payload.answers)) {
    errors.push('No answers provided');
  } else if (payload.answers.length === 0) {
    errors.push('No answers provided');
  } else {
    // Check each answer has required fields
    const hasInvalidAnswer = payload.answers.some(answer => 
      !answer.questionId || typeof answer.answer === 'undefined' || 
      typeof answer.timeSpent === 'undefined'
    );
    
    if (hasInvalidAnswer) {
      errors.push('Invalid answer format');
    }
  }
  
  // Return validation result
  if (errors.length > 0) {
    return {
      isValid: false,
      errors
    };
  }
  
  return {
    isValid: true
  };
}
