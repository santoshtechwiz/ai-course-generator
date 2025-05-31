import type { BlankQuestion, BlankAnswer, QuizResult } from '../../types';

export type { BlankQuestion, BlankAnswer };

export interface BlanksQuizResult extends QuizResult {
  questionResults?: Array<{
    questionId: string | number;
    userAnswer?: string;
    correctAnswer?: string;
    isCorrect?: boolean;
    feedback?: string;
  }>;
}
