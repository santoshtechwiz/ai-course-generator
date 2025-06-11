// Types for Blanks quiz component

export interface BlankQuestion {
  id: string;
  question: string;
  answer: string;
  hints?: string[];
}

export interface BlankQuizResult {
  title?: string;
  maxScore?: number;
  userScore?: number;
  score?: number;
  percentage?: number;
  completedAt?: string | Date;
  questionResults?: Array<{
    questionId: string | number;
    userAnswer?: string;
    correctAnswer?: string;
    isCorrect?: boolean;
    similarity?: number;
    similarityLabel?: string;
    question?: string;
  }>;
}
