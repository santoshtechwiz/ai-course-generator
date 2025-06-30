// Types for Blanks quiz component

export interface BlankQuestion {
  id: number
  question: string
  answer: string
  openEndedQuestion: OpenEndedQuestion
}

export interface OpenEndedQuestion {
  hints: string[]
  difficulty: string
  tags: string[]
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
