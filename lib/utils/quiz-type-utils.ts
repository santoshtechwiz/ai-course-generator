import { CodeQuizQuestion } from "@/app/types/code-quiz-types"

/**
 * Type guard to check if a question is a code question
 */
export function isCodeQuestion(question: any): question is CodeQuizQuestion {
  return question?.type === 'code';
}

/**
 * Type guard to check if a question is an MCQ question
 */
export function isMCQQuestion(question: any): boolean {
  return question?.type === 'mcq' && Array.isArray(question?.options);
}

/**
 * Type guard to check if a question is a blanks question
 */
export function isBlanksQuestion(question: any): boolean {
  return question?.type === 'blanks' && typeof question?.correctAnswers === 'object';
}

/**
 * Type guard to check if a question is an open-ended question
 */
export function isOpenEndedQuestion(question: any): boolean {
  return question?.type === 'openended';
}

/**
 * Get the correct answer for a question based on its type
 */
export function getCorrectAnswer(question: any): string {
  if (!question) return "";
  
  if (question.type === 'code') {
    return question.answer || question.correctAnswer || "";
  } else if (question.type === 'mcq') {
    return question.correctAnswer || "";
  } else if (question.type === 'blanks' && question.correctAnswers) {
    return typeof question.correctAnswers === 'object' 
      ? JSON.stringify(question.correctAnswers) 
      : question.correctAnswers;
  } else if (question.type === 'openended') {
    return question.modelAnswer || "Model answer not provided";
  }
  
  return question.answer || question.correctAnswer || "";
}

/**
 * Check if an answer is correct based on question type
 */
export function isAnswerCorrect(question: any, userAnswer: any): boolean {
  if (!question) return false;
  
  if (question.type === 'code') {
    return userAnswer === (question.answer || question.correctAnswer);
  } else if (question.type === 'mcq') {
    return userAnswer === question.correctAnswer;
  } else if (question.type === 'blanks' && question.correctAnswers) {
    try {
      if (!question.correctAnswers) return false;
      const parsedAns = typeof userAnswer === 'object' 
        ? userAnswer 
        : JSON.parse(userAnswer as string);
      return Object.entries(question.correctAnswers).every(
        ([key, value]) => parsedAns[key] === value
      );
    } catch {
      return false;
    }
  } else if (question.type === 'openended') {
    return question.modelAnswer ? userAnswer === question.modelAnswer : true;
  }
  
  return false;
}
